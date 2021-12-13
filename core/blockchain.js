const { yellow, green } = require('colors')
const Block = require('./block')
const Database = require('./database')
const BlockchainIterator = require('./iterator')
const ProofOfWork = require('./proof')
const Transaction = require('./transaction')
const { hasInputReferTo } = require('./utils/tx')
const Wallet = require('./wallet')

class BlockChain {
  constructor(config) {
    const tmpPath = config.tmp || './tmp'
    this.db = new Database(tmpPath + '/block')
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
    const lastHeight = await this.getBestHeight()
    const block = new Block(transactions, lastBlockHash, lastHeight + 1)
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
    return new Block([coinbase], '', 0)
  }

  async initBlockChain() {
    const lastBlockHash = await this.db.get('l')
    if (!lastBlockHash) {
      console.log(yellow('No existing blockchain found. Create one first.'))
      return
    }
    this.tip = lastBlockHash
  }

  /**
   *
   * @param {Wallet} wallet
   * @returns {Promise<Boolean>}
   */
  async createBlockChain(wallet) {
    const lastBlockHash = await this.db.get('l')
    if (lastBlockHash) {
      console.log(yellow('Blockchain already exists.'))
      return false
    } else {
      const coinbase = Transaction.NewCoinbaseTX(wallet)
      const genesis = this.newGenesisBlock(coinbase)
      const pow = new ProofOfWork(genesis)
      const { nonce, hash } = pow.run()
      genesis.nonce = nonce
      genesis.hash = hash
      await this.db.put(genesis.hash, genesis.serialize())
      await this.db.put('l', genesis.hash)
      this.tip = genesis.hash
      console.log(green('Create blockchain success!'))
      return true
    }
  }

  async findUTXO() {
    const UTXO = {}
    const spentTXOs = {}
    const bci = new BlockchainIterator(this.tip, this.db)
    while (true) {
      const block = await bci.next()
      for (let i = 0; i < block.transactions.length; i++) {
        const tx = block.transactions[i]
        const txId = tx.id

        const spent = spentTXOs[txId]
        for (let outIndex = 0; outIndex < tx.vout.length; outIndex++) {
          const hasRefer = Boolean(spent) && hasInputReferTo(spent, outIndex)
          if (!hasRefer) {
            if (!UTXO[txId]) {
              UTXO[txId] = []
            }
            UTXO[txId].push(tx.vout[outIndex])
          }
        }

        if (!tx.isCoinBase()) {
          tx.vin.map((_in) => {
            const inTxID = _in.txId
            if (!spentTXOs[inTxID]) {
              spentTXOs[inTxID] = []
            }
            spentTXOs[inTxID].push(_in.vout)
          })
        }
      }

      if (!block.prevHash?.length) {
        break
      }
    }

    return UTXO
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
  async signTransaction(tx, privKey) {
    const prevTXs = {}
    for (let vix = 0; vix < tx.vin.length; vix++) {
      const vin = tx.vin[vix]
      const prevTX = await this.findTransaction(vin.txId)
      prevTXs[prevTX.id] = prevTX
    }
    tx.sign(privKey, prevTXs)
  }

  /**
   * @returns {Promise<Block>}
   */
  async getLastBlock() {
    const iterator = new BlockchainIterator(this.tip, this.db)
    const lastBlock = await iterator.next()
    return lastBlock
  }

  /**
   * @returns {Promise<Number>}
   */
  async getBestHeight() {
    const lastBlock = await this.getLastBlock()
    return lastBlock.height || 0
  }

  /**
   * @returns {Array<String>}
   */
  async getBlockHashes() {
    const bci = new BlockchainIterator(this.tip, this.db)
    const hashes = []
    while (true) {
      const block = await bci.next()
      hashes.push(block.hash)

      if (!block.prevHash.length) {
        break
      }
    }

    return hashes
  }
}

module.exports = BlockChain
