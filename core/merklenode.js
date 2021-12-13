const crypto = require('crypto')

class MerkleNode {
  /**
   * @param {MerkleNode} left
   * @param {MerkleNode} right
   * @param {String} data
   */
  constructor(left, right, data) {
    this.left = left
    this.right = right
    this.data = data
  }

  /**
   * @param {MerkleNode} left
   * @param {MerkleNode} right
   * @param {String} data
   * @returns {MerkleNode}
   */
  static NewMerkleNode(left, right, data) {
    let hash = crypto.createHash('sha256')
    if (!left && !right) {
      hash.update(data)
    } else {
      const prevHashes = left.data + right.data
      hash.update(prevHashes)
    }
    return new MerkleNode(left, right, hash.digest('hex'))
  }
}

module.exports = MerkleNode
