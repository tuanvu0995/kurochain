const bs58 = require('bs58')
const { hashPubKey } = require('./utils/hash')
const { VERSION } = require('./constants')
const { checksum } = require('./utils/wallet')

class Wallet {
  /**
   * @param {String} privateKey
   * @param {String} publicKey
   */
  constructor(privateKey, publicKey) {
    this.privateKey = privateKey
    this.publicKey = publicKey
    this.address = this.getAddress()
  }

  getAddress() {
    const pubKeyHash = hashPubKey(this.publicKey)
    const versionPayload = `${VERSION}${pubKeyHash}`
    const _checksum = checksum(versionPayload)
    const fullPayload = `${versionPayload}${_checksum}`
    const address = bs58.encode(Buffer.from(fullPayload, 'utf8'))
    return address
  }

  /**
   * @returns {String}
   */
  getPubKeyHash() {
    return hashPubKey(this.publicKey)
  }

}

module.exports = Wallet
