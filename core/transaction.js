const crypto = require('crypto')
const { hashPubKey, createPrivateKey, createPublicKey } = require('./utils/hash')
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
   * @param {String} privateKey
   * @param {Object} prevTXs
   * @returns
   */
  sign(privateKey, prevTXs) {
    if (this.isCoinBase()) {
      return
    }

    this.vin.map((_in) => {
      if (!prevTXs[_in.txId].id) {
        throw new Error('ERROR: Previous transaction is not correct')
      }
    })

    const txCopy = this.trimmedCopy()
    const privKeyObject = createPrivateKey(privateKey)

    for (let vix = 0; vix < this.vin.length; vix++) {
      const vin = this.vin[vix]
      const prevTx = prevTXs[vin.txId]

      txCopy.vin[vix].signature = null
      txCopy.vin[vix].pubKey = prevTx.vout[vin.vout].pubKeyHash
      txCopy.id = txCopy.hash()
      txCopy.vin[vix].pubKey = null

      const sign = crypto.createSign('SHA256')
      sign.update(txCopy.id)
      sign.end()
      const signature = sign.sign(privKeyObject, 'hex')

      this.vin[vix].signature = signature
    }
  }

  /**
   *
   * @param {Object} prevTXs
   * @returns {Boolean}
   */
  verify(prevTXs) {
    if (this.isCoinBase()) {
      return true
    }

    this.vin.map((_in) => {
      if (!prevTXs[_in.txId].id) {
        throw new Error('ERROR: Previous transaction is not correct')
      }
    })

    const txCopy = this.trimmedCopy()
    for (let vix = 0; vix < this.vin.length; vix++) {
      const vin = this.vin[vix]
      if (!vin.signature || !vin.pubKey) {
        return false
      }

      const prevTx = prevTXs[vin.txId]
      txCopy.vin[vix].signature = null
      txCopy.vin[vix].pubKey = prevTx.vout[vin.vout].pubKeyHash
      txCopy.id = txCopy.hash()
      txCopy.vin[vix].pubKey = null

      const verify = crypto.createVerify('SHA256')
      verify.update(txCopy.id)
      verify.end()

      const pubKeyBuffer = createPublicKey(vin.pubKey)
      if (!verify.verify(pubKeyBuffer, vin.signature, 'hex')) {
        return false
      }
    }

    return true
  }

  /**
   * @returns {Transaction}
   */
  trimmedCopy() {
    const inputs = this.vin.map((input) => ({
      txId: input.txId,
      vout: input.vout,
      signature: null,
      pubKey: null,
    }))
    return new Transaction('', inputs, [...this.vout])
  }

  static deserialize(transaction) {
    return new Transaction(transaction.id, transaction.vin, transaction.vout)
  }
}

module.exports = Transaction
