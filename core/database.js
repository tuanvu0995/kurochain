const level = require('level')

class Database {
  constructor(path) {
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
}

module.exports = Database
