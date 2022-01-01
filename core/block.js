const MerkleTree = require('./merkletree')
const Transaction = require('./transaction')

class Block {
  /**
   * @param {Array<Transaction>} transactions
   * @param {String} prevHash
   * @param {Number} height
   */
  constructor(transactions, prevHash, height) {
    this.timestamp = new Date().getTime()

    /**
     * @type{Array<Transaction>}
     * @public
     */
    this.transactions = transactions
    this.prevHash = prevHash
    this.nonce = 0
    this.hash = null
    this.height = height
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
      height: this.height
    })
  }

  toMessage() {
    return `${this.timestamp}|${this.prevHash}|${this.hash}|${this.nonce}|${this.hash}|${this.height}`
  }

  fromMessage(message) {
    const arr = message.split('|')
    this.timestamp = arr[0]
    this.prevHash = arr[1]
    this.hash = arr[2]
    this.nonce = Number(arr[3])
    this.hash = arr[4]
    this.height = Number(arr[5])
  }

  /**
   *
   * @param {String} data
   */
  deserialize(data) {
    const { timestamp, transactions, prevHash, nonce, hash, height } =
      JSON.parse(data) || {}
    this.timestamp = timestamp
    this.transactions = Array.isArray(transactions)
      ? transactions.map(Transaction.deserialize)
      : []
    this.prevHash = prevHash
    this.nonce = nonce
    this.hash = hash
    this.height = height
  }
}

module.exports = Block
