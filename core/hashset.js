const Database = require('./database')
const BlockChain = require('./blockchain')
const Block = require('./block')
const BlockchainIterator = require('./iterator')

class HashSet {
  /**
   * @param {BlockChain}
   * @param {Object} config
   */
  constructor(blockChain, config) {
    const tmpPath = config.tmp || './tmp'
    this.db = new Database(tmpPath + '/hashes')
    this.blockChain = blockChain
  }

  async reindex() {
    const bci = new BlockchainIterator(this.blockChain.tip, this.blockChain.db)
    while (true) {
      const block = await bci.next()
      console.log('Indexing :' + block.hash)
      await this.update(block)

      if (!block.prevHash?.length) {
        break
      }
    }
  }

  /**
   *
   * @param {Block} block
   */
  async update(block) {
    await this.db.put(String(block.height), block.hash)
  }

  /**
   *
   * @param {Number} height
   * @returns {Promise<String>}
   */
  async getHash(height) {
    const hash = await this.db.get(String(height))
    return hash
  }

  /**
   * @param {Number} startHeight
   * @param {Number} endHeight
   * @returns {Array<Block>}
   */
  async getHashes(startHeight, endHeight) {
    const limit = 20
    const hashes = []
    let currentHeight = startHeight
    const stopHeight = currentHeight - limit
    for await (const [height, hash] of this.db.iterator()) {
      const blockHeight = Number(height)
      if (blockHeight <= startHeight) {
        hashes.push(hash)
      }
      currentHeight = blockHeight

      if (currentHeight <= stopHeight || currentHeight <= endHeight) {
        break
      }
    }

    return hashes
  }
}

module.exports = HashSet
