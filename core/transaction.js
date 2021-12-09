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

  /**
   * 
   * @param {String} unlockingData
   * @return {Boolean}
   */
   canBeUnlockedWith(unlockingData) {
    return this.scriptPubKey === unlockingData
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

  /**
   * 
   * @param {String} unlockingData
   * @return {Boolean}
   */
   canUnlockOutputWith(unlockingData) {
    return this.ScriptSig === unlockingData
  }
}

class Transaction {
  /**
   * 
   * @param {String} id 
   * @param {Array<TXInput>} txIn 
   * @param {Array<TXOutput>} txOut 
   */
  constructor(id, txIn, txOut) {
    /**
     * @type{Sring}
     * @public
     */
    this.id = id

    /**
     * @type{Array<TXInput>}
     * @public
     */
    this.vin = txIn

    /**
     * @type{Array<TXOutput>}
     * @public
     */
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
   * @returns {Boolean}
   */
  isCoinbase() {
    return this.vin.txId === ''
  }
  
}

module.exports = Transaction