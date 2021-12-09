const Block = require('./block')
const Database = require('./database')
const BlockchainIterator = require('./iterator')
const ProofOfWork = require('./proof')
const Transaction = require('./transaction')

const COINS = 1000

class BlockChain {
  constructor() {
    this.db = new Database('./tmp/block')
    this.tip = null
  }

  /**
   *
   * @param {Array<Transaction>} transactions
   * @return {Block}
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
   * @returns
   */
  newGenesisBlock(coinbase) {
    return new Block([coinbase], '')
  }

  async initBlockChain(address) {
    const lastBlockHash = await this.db.get('l')
    if (lastBlockHash) {
      this.tip = lastBlockHash
    } else {
      const coinbase = Transaction.NewCoinbaseTX(address, COINS)
      const genesis = this.newGenesisBlock(coinbase)
      await this.db.put(genesis.hash, genesis.serialize())
      await this.db.put('l', genesis.hash)
    }
  }

  /**
   *
   * @param {String} address
   * @return {Array<Transaction>}
   */
  async findUnspentTransactions(address) {
    const unspentTXs = []
    bci = new BlockchainIterator(this.tip)
    while (true) {
      const block = await bci.next()
      for (let tx in block.transactions) {
        const txId = tx.id
      }
    }
  }
}

module.exports = BlockChain
