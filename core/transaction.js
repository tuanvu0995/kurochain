const REWARD = 100

class TXOutput {
  /**
   * @param {Number} value
   * @param {String} scriptPubKey
   */
  constructor(value, scriptPubKey) {
    this.value = value
    this.scriptPubKey = scriptPubKey
  }
}

class TXInput {
  /**
   * @param {String} txId
   * @param {Number} vout
   * @param {String} scriptSig
   */
  constructor(txId, vout, scriptSig) {
    this.txId = txId
    this.vout = vout
    this.scriptSig = scriptSig
  }
}

class Transaction {
  constructor(id, txIn, txOut) {
    this.id = id
    this.vin = txIn
    this.vout = txOut
  }

  static NewCoinbaseTX(to, data) {
    if (!data) {
      data = 'Reward to ' + to
    }
    const txIn = new TXInput('', -1, data)
    const txOut = new TXOutput(REWARD, to)
    return new Transaction('', txIn, txOut)
  }

  /**
   * 
   * @param {String} unlockingData
   * @return {Boolean}
   */
  canUnlockOutputWith(unlockingData) {
    return this.txIn.ScriptSig === unlockingData
  }

  /**
   * 
   * @param {String} unlockingData
   * @return {Boolean}
   */
  canBeUnlockedWith(unlockingData) {
    return this.txOut.ScriptSig === unlockingData
  }
}

module.exports = Transaction