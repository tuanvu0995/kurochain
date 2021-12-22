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
const HashSet = require('../core/hashset')

class Commandline {
  /**
   * @param {BlockChain} blockChain
   * @param {WalletManager} walletManager
   * @param {UTXOSet} utxoSet
   * @param {HashSet} hashSet
   */
  constructor(blockChain, walletManager, utxoSet, hashSet) {
    this.blockChain = blockChain
    this.wlmg = walletManager
    this.utxoSet = utxoSet
    this.hashSet = hashSet
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

    if (amount < 0) {
      throw new Error('ERROR: Amount must > 0')
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
    await this.hashSet.update(block)
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
      this.hashSet.reindex()
    }
  }

  // async testCmd() {
  //   const wallets = [
  //     'bSNT9LD8z94JqZB5TQtGWZdJrGhWg9PGdJtFEoEdSQGJQSLbTZFWfwHvnyLVPws8kHnB',
  //     'bSNTX2BY81sxB7jgrkHyDvrKFSw5iS2GsiFGjJU8YNBGDAC9bpmVkxfdgrXzTTZK7oUB',
  //     'bSLt3JvTADRc8q1tu1ViEKNfoiwH5wWmYm45sQMU76mp4K7JTJNwSsBtRAxQDZBBdzbo',
  //     'bSNTBqL8TygKrUCqTbhAJSzf6JeAjHne2SqGS5GbrpnibCPx1gMpmFR2dEMXWaZyQLq1',
  //     'bSLsdnLfpQ1nzcFBiy6MM6knZXtAmXDg8g4stDVHurUk1ZfvLvE8GFmGURK1quDGzZwW',
  //     'bSLqYo4nud5VSVaKG6X6R1cdG1rXVzLAgDyhYgXCQBf4FYuWjqpeEwQdXzPzt7Hwq9Zc',
  //     'bSNVKEYXfMAkeC9AULBCSNdu5VQLsJMgf1AoxmQZpAs1A4A3rHwfsridBg5CUWoHs2Xf',
  //     'bSLqYncKcJAUcBK9QvCGzDpgjGvmfNhQc4vsoP1Y1GSfeHRzGXHvSxkwjmvYzb4NLvbK',
  //     'bSNbdxwU5tpTzGsdJ7JEaRtQ5BcBBhmcpdkgjvJM1CURCwvjXHsRNh9BUS788GT9J8yK',
  //     'bSNbgNj87REHpmntbRnvkjVtZ2yun9KDY3NgptiHi467pdoFjEgvYUYUnNAH4EZDKEvB',
  //     'bSLmJs8imDzsuS6kFQnihQ134tPWDzq1xXoUo9zAC7UwSof6SfBxtEHAj9Q9xfdPgofd',
  //     'bSLz5kaaMfDLQ7yEXd6rdfoejKXfMdgA67MHKaSPRirh4Q4HbUcSJp3of3RmZr7KzK93',
  //     'bSLqVuKP9mKoMFgb5y1qAEo7WSqvRwT3oHpb8c4tYoFdQQwC1wVnonVEdeh2FtRQmmc5',
  //     'bSLwvWFUeswtfqKJqVvqYvDxvkQTtocV3rAQqWsbCPGcogPWRjyqPazsTVPW344ZdRpX',
  //     'bSLmKLyvEaWKtTyLx9M54p3toVZbuiX1iUpohbLzEHV2hd3BC7xovmLrQvXLY76GtY4g',
  //     'bSNXokWa9xTsdjTy3ejSbPbg4oiBE2fCDEGL9iG4X7AkjfTwa4gnNAn1KCakpu94r1yn',
  //     'bSLh1eVvYX9kpoSmRXQCM3SuFU4f6BgzCcBMYNtHJ8LVpdeoVrXMZYj92GMdDaLcZeji',
  //     'bSNXnnhdEo4K9nZgG7toQzvUb9XW3AFsFDEkM7iEDqoLRZeDRidsEgoBHHtpHaew9Saz',
  //     'bSNVHhY67BxpqkD5quKenYTwx5iQtBR55dJnvq6kngz1WGVncbMHxrSn4DnAufQhmbdw',
  //     'bSNeBwynKZLJoCG5F8sFENzWWMeDsSby8jRbGK4CrfzrXRmLtcbUPzW5MPygYNwVniZR',
  //     "bSNXQcePvM6QvWUo8CKMKRrggNBGGJFpF6c1oAgFtT9oggAFnL1wQPLE44XgccVHz8jB",
  //     "bSLt2vLPTZyXAS8pWgiCh135YXqiJ8TTvByBHZxfNMx1FeveZPyQRUW98tpjmkiwAwoy",
  //     "bSNdpqBwKkTzSWghUp3yb1YDCojDvaks2gopBwDVqVCe4y7ehq8GhobQ5CUkyKnJKex9",
  //     "bSLqYo3WZ1Jo4TSP95Lv1yEs4ZW8JFDLTbHEDHT9nctYTcU8uPSJy8pBAiCPsvBmDeDm",
  //     "bSLj86ej6gyQy4DgccVpyMcf1DvbEMdBMDqnYoSBbNXwkntyhowjyKuKZwiuMmfRwsMd",
  //     "bSNVezp5GqncC4ocqe9d3vvEAsmxTv6Qtf8aNnbkQ4D8HJEZ8s5BsLPEoG5BZa5xJ58z",
  //     "bSLz4nKED9xia6BDMpRtNdCRdVX6dWQDgBYycBcE3o6oR2TGSbahqLJZyTqk1DqEqzpy",
  //     "bSLesn8bboaL12qQkggyekpsHia4vrJtGRf3TJU4qTrb7ZqfTSKZDVCa1CVUShuqRAPt",
  //     "bSLzTXTtYooqhkERznPvE4NQVdJ9kQQJuuaRxxBf9aquA77vqVUxqNTkY15SfNyJ2ymP",
  //     "bSLun41Ts5vVwtrFrE69DubsqU4LJKYFWvTSBi2WNuLQPvkcoeDmy5ymCAY3WHUGc5gB",
  //     "bSLun41Ts5vVwtrFrE69DubsqU4LJKYFWvTSBi2WNuLQPvkcoeDmy5ymCAY3WHUGc5gB"
  //   ]
  //   let amount = 10000
  //   for (let i = 0; i < 100; i++) {
  //     for (let wlIx = 0; wlIx < wallets.length; wlIx++) {
  //       if (wlIx < wallets.length - 1) {
  //         await this.send(wallets[wlIx], wallets[wlIx + 1], amount)
  //       }
  //     }
  //     amount -= 50

  //     if (amount <= 0) {
  //       break
  //     }
  //   }
  // }

  async testCmd() {
    const blocks = await this.blockChain.getBlocks(100, 5)
    console.log(`Found ${blocks.length} blocks:`)
    blocks.map((bl, index) => console.log(`Hash: ${index}: ${bl}`))
  }

  async reindexUTXO() {
    console.log('Reindex UTXO stated!')
    await this.utxoSet.reindex()
    console.log(colors.green('Reindex UTXO success!'))

    console.log('Reindex Hash stated!')
    await this.hashSet.reindex()
    console.log(colors.green('Reindex Hash success!'))
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
