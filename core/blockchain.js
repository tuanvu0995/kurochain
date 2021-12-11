const { yellow } = require('colors')
const Block = require('./block')
const Database = require('./database')
const BlockchainIterator = require('./iterator')
const ProofOfWork = require('./proof')
const Transaction = require('./transaction')
const { hexToString } = require('./utils/hexToString')
const {
  hasInputReferTo,
  usesKey,
  isLockedWithKey,
  lock,
} = require('./utils/tx')
const Wallet = require('./wallet')

class BlockChain {
  constructor() {
    this.db = new Database('./tmp/block')
    this.tip = null
  }

  /**
   *
   * @param {Array<Transaction>} transactions
   * @returns {Promise<Block>}
   */
  async mineBlock(transactions) {
    for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
      const isValid = await this.verifyTransaction(transactions[txIndex])
      if (!isValid) {
        throw new Error('ERROR: Invalid transaction')
      }
    }

    const block = await this.addBlock(transactions)
    return block
  }

  /**
   *
   * @param {Array<Transaction>} transactions
   * @return {Promise<Block>}
   */
  async addBlock(transactions) {
    const lastBlockHash = await this.db.get('l')
    const block = new Block(transactions, lastBlockHash)
    const pow = new ProofOfWork(block)
    const { nonce, hash } = pow.run()
    block.nonce = nonce
    block.hash = hash

    await this.db.put(hash, block.serialize())
    await this.db.put('l', hash)

    this.tip = hash
    return block
  }

  /**
   *
   * @param {Transaction} coinbase
   * @returns {Block}
   */
  newGenesisBlock(coinbase) {
    return new Block([coinbase], '')
  }

  async initBlockChain() {
    const lastBlockHash = await this.db.get('l')
    if (!lastBlockHash) {
      console.log(
        yellow("No existing blockchain found. Create one first.")
      )
      return
    }
    this.tip = lastBlockHash
  }

  /**
   *
   * @param {Wallet} wallet
   */
  async createBlockChain(wallet) {
    const lastBlockHash = await this.db.get('l')
    if (lastBlockHash) {
      console.log(yellow("Blockchain already exists."))
    } else {
      const coinbase = Transaction.NewCoinbaseTX(wallet)
      const genesis = this.newGenesisBlock(coinbase)
      const pow = new ProofOfWork(genesis)
      const { nonce, hash } = pow.run()
      genesis.nonce = nonce
      genesis.hash = hash
      await this.db.put(genesis.hash, genesis.serialize())
      await this.db.put('l', genesis.hash)
      this.tip = genesis
    }
  }

  /**
   *
   * @param {String} pubKeyHash
   * @return {Array<Transaction>}
   */
  async findUnspentTransactions(pubKeyHash) {
    const unspentTXs = []
    const spentTXOs = {}
    const bci = new BlockchainIterator(this.tip, this.db)
    while (true) {
      const block = await bci.next()
      for (let i = 0; i < block.transactions.length; i++) {
        const tx = block.transactions[i]
        const txId = hexToString(tx.id)

        for (let outIndex = 0; outIndex < tx.vout.length; outIndex++) {
          const out = tx.vout[outIndex]
          const spend = spentTXOs[txId]
          const hasRefer = Boolean(spend) && hasInputReferTo(spend, outIndex)
          if (!hasRefer && isLockedWithKey(out, pubKeyHash)) {
            unspentTXs.push(tx)
          }
        }

        if (!tx.isCoinBase()) {
          tx.vin.map((_in) => {
            if (usesKey(_in, pubKeyHash)) {
              const inTxID = hexToString(_in.txId)
              if (!spentTXOs[inTxID]) {
                spentTXOs[inTxID] = []
              }
              spentTXOs[inTxID].push(_in.vout)
            }
          })
        }
      }

      if (!block.prevHash?.length) {
        break
      }
    }

    return unspentTXs
  }

  /**
   * @param {String} pubKeyHash
   * @returns{Array}
   */
  async findUTXO(pubKeyHash) {
    const UTXOs = []
    const unspentTransactions = await this.findUnspentTransactions(pubKeyHash)
    unspentTransactions.map((unspendTx) => {
      unspendTx.vout.map((out) => {
        if (isLockedWithKey(out, pubKeyHash)) {
          UTXOs.push(out)
        }
      })
    })
    return UTXOs
  }

  /**
   *
   * @param {String} pubKeyHash
   * @param {Number} amount
   * @returns {{accumulated: Number, unspentOutputs: Object}}
   */
  async findSpendableOutputs(pubKeyHash, amount) {
    const unspentOutputs = {}
    const unspentTXs = await this.findUnspentTransactions(pubKeyHash)
    let accumulated = 0

    for (let txIndex = 0; txIndex < unspentTXs.length; txIndex++) {
      const tx = unspentTXs[txIndex]
      const txId = hexToString(tx.id)

      if (!unspentOutputs[txId]) {
        unspentOutputs[txId] = []
      }

      for (let outIndex = 0; outIndex < tx.vout.length; outIndex++) {
        const out = tx.vout[outIndex]
        if (isLockedWithKey(out, pubKeyHash)) {
          accumulated += out.value
          unspentOutputs[txId].push(outIndex)
        }
      }

      if (accumulated >= amount) {
        break
      }
    }

    return { accumulated, unspentOutputs }
  }

  /**
   *
   * @param {Wallet} from
   * @param {address} to
   * @param {Number} amount
   * @returns {Transaction}
   */
  async newUTXOTransaction(from, to, amount) {
    let inputs = []
    const outputs = []

    const { accumulated, unspentOutputs } = await this.findSpendableOutputs(
      from.getPubKeyHash(),
      amount
    )
    if (accumulated < amount) {
      throw new Error('ERROR: Not enough funds')
    }

    for (let txId in unspentOutputs) {
      const outs = unspentOutputs[txId]
      inputs = outs.map((out) => ({ txId, vout: out, pubKey: from.publicKey }))
    }
    const out = lock({ value: amount }, to)
    outputs.push(out)

    if (accumulated > amount) {
      outputs.push({
        value: accumulated - amount,
        pubKeyHash: from.getPubKeyHash(),
      })
    }

    const tx = new Transaction('', inputs, outputs)
    tx.id = tx.hash()
    await this.syncTransaction(tx, from.privateKey)

    return tx
  }

  /**
   *
   * @param {Transaction} transaction
   * @returns {Promise<Boolean>}
   */
  async verifyTransaction(transaction) {
    if (transaction.isCoinBase()) {
      return true
    }

    const prevTXs = []
    for (let vinIndex = 0; vinIndex < transaction.vin.length; vinIndex++) {
      const prevTx = await this.findTransaction(transaction.vin[vinIndex].txId)
      if (!prevTXs) {
        throw new Error('ERROR: Transaction is not found')
      }
      prevTXs[prevTx.id] = prevTx
    }

    return transaction.verify(prevTXs)
  }

  /**
   *
   * @param {String} id
   * @return {Promise<Transaction>}
   */
  async findTransaction(id) {
    const bci = new BlockchainIterator(this.tip, this.db)

    while (true) {
      const block = await bci.next()
      for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
        if (block.transactions[txIndex].id === id) {
          return block.transactions[txIndex]
        }
      }

      if (!block.prevHash.length) {
        break
      }
    }

    return null
  }

  /**
   * 
   * @param {Transaction} tx 
   * @param {String} privKey 
   */
  async syncTransaction(tx, privKey) {
    const prevTXs = {}
    for (let vix = 0; vix < tx.vin.length; vix++) {
      const vin = tx.vin[vix]
      const prevTX = await this.findTransaction(vin.txId)
      prevTXs[prevTX.id] = prevTX
    }
    tx.sign(privKey, prevTXs)
  }
}

module.exports = BlockChain
