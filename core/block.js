const crypto = require('crypto')
const Transaction = require('./transaction')

class Block {
  /**
   * @param {Array<Transaction>} transactions
   * @param {String} prevHash
   */
  constructor(transactions, prevHash) {
    this.timestamp = new Date().getTime()
    this.transactions = transactions
    this.prevHash = prevHash
    this.nonce = 0
    this.hash = null
  }

  /**
   * @returns {String}
   */
  hashTransactions() {
    const txHashes = []
    this.transactions.map((transaction) => {
      txHashes.push(transaction.id)
    })

    return crypto.createHash('sha256').update(txHashes.join()).digest('hex')
  }

  /**
   * @returns {String}
   */
  serialize() {
    return JSON.stringify({
      timestamp: this.timestamp,
      transactions: this.transactions,
      prevHash: this.prevHash,
      nonce: this.nonce,
      hash: this.hash,
    })
  }

  /**
   *
   * @param {String} data
   */
  deserialize(data) {
    const { timestamp, transactions, prevHash, nonce, hash } =
      JSON.parse(data) || {}
    this.timestamp = timestamp
    this.transactions = transactions
    this.prevHash = prevHash
    this.nonce = nonce
    this.hash = hash
  }
}

module.exports = Block
