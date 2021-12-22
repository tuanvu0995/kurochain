const level = require('level')
const fs = require('fs')

class Database {
  constructor(path) {
    this.createDirIfNotExists(path)
    this.db = level(path, { valueEncoding: 'json', createIfMissing: true })
  }

  async put(key, value) {
    try {
      return await this.db.put(key, value)
    } catch (err) {
      return null
    }
  }

  async get(key) {
    try {
      return await this.db.get(key)
    } catch (err) {
      return null
    }
  }

  async delete(key) {
    try {
      await this.db.del(key)
      return true
    } catch (err) {
      return false
    }
  }

  async clear() {
    try {
      await this.db.clear()
    } catch (err) {
      console.log(err)
    }
  }

  iterator(limit) {
    return this.db.iterator({ limit })
  }

  /**
   * @param {String} path
   */
  createDirIfNotExists(path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  }
}

module.exports = Database
