const MerkleNode = require('./merklenode')

class MerkleTree {
  /**
   * @param {MerkleNode} node
   */
  constructor(node) {
    this.rootNode = node
  }

  /**
   * @param {Array<String>} data
   * @returns {MerkleTree}
   */
  static NewMerkleTree(data) {
    let nodes = []
    if (data.length % 2 !== 0) {
      data.push(data[data.length - 1])
    }

    data.map((dt) => {
      const node = MerkleNode.NewMerkleNode(null, null, dt)
      nodes.push(node)
    })

    for (let dtix = 0; dtix < data.length / 2; dtix++) {
      const newLevel = []
      for (let ndix = 0; ndix < nodes.length; ndix += 2) {
        const node = MerkleNode.NewMerkleNode(nodes[ndix], nodes[ndix + 1], null)
        newLevel.push(node)
      }

      nodes = newLevel
    }

    return new MerkleTree(nodes[0])
  }
}

module.exports = MerkleTree
