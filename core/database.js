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
}

module.exports = Database
