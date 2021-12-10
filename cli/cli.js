const colors = require('colors')
const clear = require('clear')
const figlet = require('figlet')
const BlockChain = require('../core/blockchain')
const BlockchainIterator = require('../core/iterator')
const Transaction = require('../core/transaction')

class Commandline {
  /**
   * @param {BlockChain} blockChain
   */
  constructor(blockChain) {
    this.blockChain = blockChain
  }

  greeting() {
    console.log(
      colors.yellow(figlet.textSync('KuroCoin', { horizontalLayout: 'full' }))
    )
  }

  /**
   * @param {String} address
   * @returns {Promise<Number>}
   */
  async getBalance(address) {
    const UTXOs = await this.blockChain.findUTXO(address)
    const balance = UTXOs.map((out) => out.value).reduce((pv, cv) => pv + cv, 0)
    return balance
  }

  /**
   * @param {String} from
   * @param {String} to
   * @param {Promise<Number>} amount
   */
  async send(from, to, amount) {
    const tx = await this.blockChain.newUTXOTransaction(from, to, amount)
    await this.blockChain.mineBlock([tx])
    console.log(
      colors.green(
        `Send ${colors.red(amount)} coin to ${colors.red(to)} success!`
      )
    )
  }

  /**
   *
   * @param {Number} start
   * @param {Number} limit
   */
  async printChain(start = 0, limit = 10) {
    clear()
    const bci = new BlockchainIterator(this.blockChain.tip, this.blockChain.db)
    let index = 0
    while (true) {
      const block = await bci.next()
      if (index >= start) {
        console.log(colors.green(`${index + 1}. Block Hash: ${block.hash}`))
        console.log(`PrevHash: ${block.prevHash}`)
        console.log('Transactions: ')
        block.transactions.map((tx) => {
          console.log('TX.id: ', tx.id)
          console.log('TX.vin: ', tx.vin)
          console.log('TX.vout: ', tx.vout)
        })
        index++
      }

      if (!block.prevHash.length || index - start >= limit) {
        break
      }
    }
  }

  /**
   *
   * @param {String} txId
   * @returns {Promise<Transaction>}
   */
  async findTX(txId) {
    const bci = new BlockchainIterator(this.blockChain.tip, this.blockChain.db)
    while (true) {
      const block = await bci.next()
      const tx = block.transactions.find((tx) => tx.id === txId)
      if (tx) {
        return tx
      }

      if (!block.prevHash.length) {
        break
      }
    }

    return null
  }
}

module.exports = Commandline
