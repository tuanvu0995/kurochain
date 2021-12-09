const BlockChain = require('../core/blockchain')

class Commandline {
  /**
   * @param {BlockChain} blockChain 
   */
  constructor(blockChain) {
    this.blockChain = blockChain
  }

  /**
   * @param {String} address 
   * @returns {Number}
   */
  async getBalance (address) {
    const UTXOs = await this.blockChain.findUTXO(address)
    const balance = UTXOs.map((out) => out.value).reduce((pv, cv) => pv + cv, 0)
    return balance
  }

  /**
   * @param {String} from 
   * @param {String} to 
   * @param {Number} amount 
   */
  async send(from, to, amount) {
    const tx = await this.blockChain.newUTXOTransaction(from, to, amount)
    await this.blockChain.mineBlock([tx])
    console.log('Success!')
  }
}

module.exports = Commandline