const level = require('level')
const fs = require('fs')

class Database {
  constructor(path) {
    this.createDirIfNotExists()
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
    await this.db.clear()
  }

  iterator() {
    return this.db.iterator()
  }

  createDirIfNotExists() {
    if (!fs.existsSync('./tmp')) {
      fs.mkdirSync('./tmp')
    }
  }
}

module.exports = Database
