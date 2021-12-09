const Block = require('./block')
const Database = require('./database')
const BlockchainIterator = require('./iterator')
const ProofOfWork = require('./proof')
const Transaction = require('./transaction')
const { hexToString } = require('./utils/hexToString')

const COINS = 1000

class BlockChain {
  constructor() {
    this.db = new Database('./tmp/block')
    this.tip = null
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
    const spentTXOs = []
    const bci = new BlockchainIterator(this.tip, this.db)
    while (true) {
      const block = await bci.next()
      for (let tx in block.transactions) {
        const txId = hexToString(tx.id)

        for (let out in tx.vout) {
          if (spentTXOs[txId]) {
            for (let spentOut in spentTXOs[txId]) {
              if (spentOut === out) {
                continue
              }
            }
          }
          if (out.CanBeUnlockedWith(address)) {
            unspentTXs.push(tx)
          }
        }

        if (!tx.isCoinBase()) {
          for (let _in in tx.vin) {
            if (_in.canUnlockOutputWith(address)) {
              const inTxID = hexToString(_in.Txid)
              spentTXOs[inTxID].push(_in.Vout)
            }
          }
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
  findUTXO(address) {
    const UTXOs = []
    const unspentTransactions = this.findUnspentTransactions(address)
    for (let tx in unspentTransactions) {
      for (let out in tx.vout) {
        if (out.canBeUnlockedWith(address)) {
          UTXOs.push(out)
        }
      }
    }

    return UTXOs
  }
}

module.exports = BlockChain
