const crypto = require('crypto')

const REWARD = 100

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

  static NewCoinbaseTX(to, data) {
    if (!data) {
      data = 'Reward to ' + to
    }
    const txIn = { txId: '', vout: -1, scriptSig: data }
    const txOut = { value: REWARD, scriptPubKey: to }
    return new Transaction('', [txIn], [txOut])
  }

  hash() {
    const {id, vin, vout} = this
    const hashData = JSON.stringify({id, vin: vin, vout: vout})
    return crypto.createHash('sha256').update(hashData).digest('hex')
  }

  /**
   * @returns {Boolean}
   */
  isCoinBase() {
    return this.id === ''
  }

  /**
   * @param {Object} txOutput
   * @param {String} unlockingData
   * @return {Boolean}
   */
  canBeUnlockedWith(txOutput, unlockingData) {
    return txOutput.scriptPubKey === unlockingData
  }

  /**
   * @param {Object} txInput
   * @param {String} unlockingData
   * @return {Boolean}
   */
  canUnlockOutputWith(txInput, unlockingData) {
    return txInput.ScriptSig === unlockingData
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

  static deserialize(transaction) {
    return new Transaction(transaction.id, transaction.vin, transaction.vout)
  }
}

module.exports = Transaction
