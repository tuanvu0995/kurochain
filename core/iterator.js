const Block = require('./block')

class BlockchainIterator {
  constructor(currentHash, db) {
    this.currentHash = currentHash
    this.db = db
  }

  async next() {
    const block = new Block()
    const data = await this.db.get(this.currentHash)
    block.deserialize(data)
    this.currentHash = block.prevHash
    return block
  }
}

module.exports = BlockchainIterator