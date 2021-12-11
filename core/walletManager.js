const crypto = require('crypto')
const Database = require('./database')
const Wallet = require('./wallet')

class WalletManager {
  constructor() {
    this.db = new Database('./tmp/wallet')
    this.wallets = {}
  }

  /**
   * @returns {Array<String>}
   */
  getAddresses() {
    if (!this.wallets) {
      return []
    }
    return Object.keys(this.wallets)
  }

  /**
   *
   * @param {String} address
   * @returns {Wallet}
   */
  getWallet(address) {
    return this.wallets[address]
  }

  /**
   * @returns {Wallet}
   */
  async createWallet() {
    const key = this.newKeyPair()
    const wallet = new Wallet(key.publicKey, key.privateKey)
    this.wallets[wallet.address] = wallet
    await this.saveToDisk()
    return wallet
  }

  /**
   * @returns {{
   *  privateKey: string,
   *  publicKey: string
   * }}
   */
  newKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp521r1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    })
    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
    }
  }

  async loadFromDisk() {
    const walletData = await this.db.get('wallets')
    if (!walletData) {
      return
    }

    const wallets = JSON.parse(walletData)
    for (let key in wallets) {
      const wallet = new Wallet(wallets[key].privateKey, wallets[key].publicKey)
      this.wallets[wallet.address] = wallet
    }
  }

  async saveToDisk() {
    await this.db.put('wallets', JSON.stringify(this.wallets))
  }
}

module.exports = WalletManager
