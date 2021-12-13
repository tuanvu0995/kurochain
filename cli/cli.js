const colors = require('colors')
const clear = require('clear')
const figlet = require('figlet')
const BlockChain = require('../core/blockchain')
const BlockchainIterator = require('../core/iterator')
const Transaction = require('../core/transaction')
const WalletManager = require('../core/walletManager')
const UTXOSet = require('../core/utxoset')
const { validateAddress } = require('../core/utils/wallet')
const Wallet = require('../core/wallet')

class Commandline {
  /**
   * @param {BlockChain} blockChain
   * @param {WalletManager} walletManager
   * @param {UTXOSet} utxoSet
   */
  constructor(blockChain, walletManager, utxoSet) {
    this.blockChain = blockChain
    this.wlmg = walletManager
    this.utxoSet = utxoSet
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
      throw new Error('ERROR: Address is not valid')
    }
    const wallet = this.wlmg.getWallet(address)
    if (!wallet) {
      return null
    }
    const pubKeyHash = wallet.getPubKeyHash()
    const UTXOs = await this.utxoSet.findUTXO(pubKeyHash)
    const balance = UTXOs.map((out) => out.value).reduce((pv, cv) => pv + cv, 0)
    return balance
  }

  /**
   * @returns {Promise<Array>}
   */
  async getAllAddressesBalance() {
    const balances = []
    for (let address in this.wlmg.wallets) {
      const pubKeyHash = this.wlmg.wallets[address].getPubKeyHash()
      const UTXOs = await this.utxoSet.findUTXO(pubKeyHash)
      const balance = UTXOs.map((out) => out.value).reduce(
        (pv, cv) => pv + cv,
        0
      )
      balances.push({
        address,
        balance,
      })
    }

    return balances
  }

  /**
   * @param {String} from
   * @param {String} to
   * @param {Promise<Number>} amount
   */
  async send(from, to, amount) {
    if (!validateAddress(from)) {
      throw new Error('ERROR: Sender address is not valid')
    }

    if (!validateAddress(to)) {
      throw new Error('ERROR: Sender Recipient is not valid')
    }

    const fromWallet = this.wlmg.getWallet(from)

    const tx = await Transaction.NewUTXOTransaction(
      fromWallet,
      to,
      amount,
      this.utxoSet
    )
    const rewardTx = Transaction.NewCoinbaseTX(fromWallet, true)
    const block = await this.blockChain.mineBlock([tx, rewardTx])
    await this.utxoSet.update(block)
    console.log(
      colors.green(
        `Send ${colors.red(amount)} coin to ${colors.red(to)} success!`
      )
    )

    return tx.id
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

  /**
   * @returns {String}
   */
  async createWallet() {
    const wallet = await this.wlmg.createWallet()
    console.log(colors.green('New wallet address:', wallet.address))
    return wallet.address
  }

  async printWallets() {
    clear()
    const addresses = this.wlmg.getAddresses()
    console.log(colors.green(`Found ${addresses.length} wallets:`))
    addresses.map((address, index) => console.log(`${index + 1}. ${address}`))
  }

  /**
   * @param {String} address
   */
  async createBlockChain(address) {
    if (!validateAddress(address)) {
      log.Panic('ERROR: Address is not valid')
    }
    const wallet = this.wlmg.getWallet(address)
    const result = await this.blockChain.createBlockChain(wallet)
    if (result) {
      this.utxoSet.reindex()
    }
  }

  async testCmd() {
    const UTXO = await this.blockChain.findUTXO()

    console.log(UTXO)
  }

  async reindexUTXO() {
    console.log('Reindex UTXO stated!')
    await this.utxoSet.reindex()
    console.log(colors.green('Reindex UTXO success!'))
  }

  /**
   * @param {String} address
   * @returns {Wallet}
   */
  async getWallet(address) {
    if (!validateAddress(address)) {
      log.Panic('ERROR: Address is not valid')
    }
    const balance = await this.getBalance(address)
    return { address, balance }
  }
}

module.exports = Commandline
