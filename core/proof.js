const crypto = require('crypto')

const Difficulty = 12

class ProofOfWork {
  constructor(block) {
    this.block = block
    this.target = null
  }

  /**
   * Init a nonce
   * @param {number} nonce
   */
  initNonce(nonce) {
    const { block, toHex } = this
    const data = `${block.prevHash}|${JSON.stringify(block.hashTransactions())}|${toHex(nonce)}}`
    return data
  }

  /**
   * @returns {{none: String, hash: String}}
   */
  run() {
    let hash = ''
    let nonce = 0
    while (nonce < Number.MAX_SAFE_INTEGER) {
      const data = this.initNonce(nonce)
      hash = crypto.createHash('sha256').update(data).digest('hex')
      if (hash.slice(-3) === '000') {
        break
      } else {
        nonce++
      }
    }
    return { nonce, hash }
  }

  /**
   * @return {Boolean}
   */
  validate() {
    const data = this.initNonce(this.block.nonce)
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    return hash.slice(-3) === '000'
  }

  /**
   * 
   * @param {Number} number 
   * @return {String}
   */
  toHex(number) {
    return number.toString(16)
  }
}

module.exports = ProofOfWork
