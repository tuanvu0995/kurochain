const crypto = require('crypto')
const MerkleTree = require('./merkletree')
const Transaction = require('./transaction')

class Block {
  /**
   * @param {Array<Transaction>} transactions
   * @param {String} prevHash
   */
  constructor(transactions, prevHash) {
    this.timestamp = new Date().getTime()

    /**
     * @type{Array<Transaction>}
     * @public
     */
    this.transactions = transactions
    this.prevHash = prevHash
    this.nonce = 0
    this.hash = null
  }

  /**
   * @returns {String}
   */
  hashTransactions() {
    const transactions = []
    this.transactions.map((tx) => {
      transactions.push(tx.serialize())
    })

    const mTree = MerkleTree.NewMerkleTree(transactions)

    return mTree.rootNode.data
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
    this.transactions = Array.isArray(transactions)
      ? transactions.map(Transaction.deserialize)
      : []
    this.prevHash = prevHash
    this.nonce = nonce
    this.hash = hash
  }
}

module.exports = Block
