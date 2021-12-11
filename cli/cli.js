const colors = require('colors')
const clear = require('clear')
const figlet = require('figlet')
const BlockChain = require('../core/blockchain')
const BlockchainIterator = require('../core/iterator')
const Transaction = require('../core/transaction')
const WalletManager = require('../core/walletManager')
const { validateAddress } = require('../core/utils/wallet')

class Commandline {
  /**
   * @param {BlockChain} blockChain
   * @param {WalletManager} walletManager
   */
  constructor(blockChain, walletManager) {
    this.blockChain = blockChain
    this.wlmg = walletManager
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
    if (!validateAddress(address)) {
      throw new Error("ERROR: Address is not valid")
    }
    const wallet = this.wlmg.getWallet(address)
    const pubKeyHash = wallet.getPubKeyHash()
    const UTXOs = await this.blockChain.findUTXO(pubKeyHash)
    const balance = UTXOs.map((out) => out.value).reduce((pv, cv) => pv + cv, 0)
    return balance
  }

  /**
   * @param {String} from
   * @param {String} to
   * @param {Promise<Number>} amount
   */
  async send(from, to, amount) {
    if (!validateAddress(from)) {
      throw new Error("ERROR: Sender address is not valid")
    }

    if (!validateAddress(to)) {
      throw new Error("ERROR: Sender Recipient is not valid")
    }

    const fromWallet = this.wlmg.getWallet(from)

    const tx = await this.blockChain.newUTXOTransaction(fromWallet, to, amount)
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

  async createWallet() {
    const wallet = await this.wlmg.createWallet()
    console.log(colors.green('New wallet address:', wallet.address))
  }

  async printWallets() {
    clear()
    const addresses = this.wlmg.getAddresses()
    console.log(colors.green(`Found ${addresses.length} wallets:`))
    addresses.map((address, index) => console.log(`${index+1}. ${address}`))
  }

  /**
   * @param {String} address 
   */
  async createBlockChain(address) {
    if (!validateAddress(address)) {
      log.Panic("ERROR: Address is not valid")
    }
    const wallet = this.wlmg.getWallet(address)
    await this.blockChain.createBlockChain(wallet)
    console.log(colors.green('Create blockchain success!'))
  }
}

module.exports = Commandline
