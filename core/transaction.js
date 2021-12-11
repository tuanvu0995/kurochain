const crypto = require('crypto')
const { hashPubKey } = require('./utils/hash')
const Wallet = require('./wallet')

const REWARD = 1000

class Transaction {
  /**
   *
   * @param {String} id
   * @param {Array<TXInput>} txIn
   * @param {Array<TXOutput>} txOut
   */
  constructor(id, txIn, txOut) {
    this.id = id
    this.vin = txIn
    this.vout = txOut
  }

  /**
   *
   * @param {Wallet} wallet
   * @returns {Transaction}
   */
  static NewCoinbaseTX(wallet) {
    const pubKeyHash = hashPubKey(wallet.publicKey)
    const txIn = {
      txId: '_',
      vout: -1,
      signature: null,
      pubKey: wallet.publicKey,
    }
    const txOut = { value: REWARD, pubKeyHash: pubKeyHash }
    return new Transaction('_', [txIn], [txOut])
  }

  hash() {
    const { id, vin, vout } = this
    const hashData = JSON.stringify({ id, vin: vin, vout: vout })
    return crypto.createHash('sha256').update(hashData).digest('hex')
  }

  /**
   * @returns {Boolean}
   */
  isCoinBase() {
    const { vin } = this
    return vin.length === 1 && !vin[0].txId.length && vin[0].vout === -1
  }

  /**
   *
   * @param {Array} prevTXs
   * @returns {Boolean}
   */
  verify(prevTXs) {
    if (this.isCoinBase()) {
      return true
    }

    return true
  }

  /**
   *
   * @param {String} privateKey
   * @param {Object} prevTXs
   * @returns
   */
  sign(privateKey, prevTXs) {
    if (this.isCoinBase()) {
      return
    }

    const copyTx = { ...this }

    this.vin.map((_in) => {
      const prevTX = prevTXs[_in.txId]
    })
  }

  /**
   * @returns {Transaction}
   */
  trimmedCopy() {
    const inputs = []
    const outputs = []
  }

  static deserialize(transaction) {
    return new Transaction(transaction.id, transaction.vin, transaction.vout)
  }
}

module.exports = Transaction
