const Block = require('./block')
const Database = require('./database')
const BlockchainIterator = require('./iterator')
const ProofOfWork = require('./proof')
const Transaction = require('./transaction')
const { hexToString } = require('./utils/hexToString')

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

  async initBlockChain(address) {
    const lastBlockHash = await this.db.get('l')
    if (lastBlockHash) {
      this.tip = lastBlockHash
    } else {
      const coinbase = Transaction.NewCoinbaseTX(address)
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
   * @param {String} address
   * @return {Array<Transaction>}
   */
  async findUnspentTransactions(address) {
    const unspentTXs = []
    const spentTXOs = {}
    const bci = new BlockchainIterator(this.tip, this.db)
    while (true) {
      const block = await bci.next()
      for (let i = 0; i < block.transactions.length; i++) {
        const tx = block.transactions[i]
        const txId = hexToString(tx.id)

        for (let outIndex = 0; outIndex < tx.vout.length; outIndex++) {
          let skip = false
          const out = tx.vout[outIndex]
          if (spentTXOs[txId]) {
            for (let spentOutIndex = 0; spentOutIndex < spentTXOs[txId].length; spentOutIndex++) {
              if (spentTXOs[txId][spentOutIndex] === outIndex) {
                skip = true
                break
              }
            }
          }
          if (!skip && tx.canBeUnlockedWith(out, address)) {
            unspentTXs.push(tx)
          }
        }

        if (!tx.isCoinBase()) {
          tx.vin.map((_in) => {
            if (tx.canUnlockOutputWith(_in, address)) {
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
   * @param {String} address
   * @returns{Array}
   */
  async findUTXO(address) {
    const UTXOs = []
    const unspentTransactions = await this.findUnspentTransactions(address)
    unspentTransactions.map((unspendTx) => {
      unspendTx.vout.map((out) => {
        if (unspendTx.canBeUnlockedWith(out, address)) {
          UTXOs.push(out)
        }
      })
    })
    return UTXOs
  }

  /**
   *
   * @param {String} address
   * @param {Number} amount
   * @returns {{accumulated: Number, unspentOutputs: Object}}
   */
  async findSpendableOutputs(address, amount) {
    const unspentOutputs = {}
    const unspentTXs = await this.findUnspentTransactions(address)
    let accumulated = 0

    for (let txIndex = 0; txIndex < unspentTXs.length; txIndex++) {
      const tx = unspentTXs[txIndex]
      const txId = hexToString(tx.id)

      if (!unspentOutputs[txId]) {
        unspentOutputs[txId] = []
      }

      for (let outIndex = 0; outIndex < tx.vout.length; outIndex++) {
        const out = tx.vout[outIndex]
        if (tx.canBeUnlockedWith(out, address)) {
          accumulated += out.value
          unspentOutputs[txId].push(outIndex)
          if (accumulated >= amount) {
            break
          }
        }
      }
    }

    return { accumulated, unspentOutputs }
  }

  /**
   *
   * @param {String} from
   * @param {String} to
   * @param {Number} amount
   * @returns {Transaction}
   */
  async newUTXOTransaction(from, to, amount) {
    let inputs = []
    const outputs = []

    const { accumulated, unspentOutputs } = await this.findSpendableOutputs(
      from,
      amount
    )
    if (accumulated < amount) {
      throw new Error('ERROR: Not enough funds')
    }

    for (let txId in unspentOutputs) {
      const outs = unspentOutputs[txId]
      inputs = outs.map((out) => ({ txId, vout: out, scriptSig: from }))
    }

    outputs.push({ value: amount, scriptPubKey: to })

    if (accumulated > amount) {
      outputs.push({ value: accumulated - amount, scriptPubKey: from })
    }

    const tx = new Transaction('', inputs, outputs)
    tx.id = tx.hash()

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
      const prevTx = this.findTransaction(transaction.vin[vinIndex].txId)
      if (!prevTXs) {
        throw new Error('ERROR: Transaction is not found')
      }
      prevTXs[hexToString(transaction.id)] = prevTx
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
        if ([block.transactions[txIndex]].id === id) {
          return block.transactions[txIndex]
        }
      }

      if (!block.prevHash.length) {
        break
      }
    }

    return null
  }
}

module.exports = BlockChain
