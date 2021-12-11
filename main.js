const minimist = require('minimist')
const BlockChain = require('./core/blockchain')
const Commandline = require('./cli/cli')
const { green, red } = require('colors')
const WalletManager = require('./core/walletManager')

const main = async () => {
  const walletManager = new WalletManager()
  await walletManager.loadFromDisk()
  const blockChain = new BlockChain()
  await blockChain.initBlockChain()

  const cli = new Commandline(blockChain, walletManager)

  const argv = minimist(process.argv.slice(2))
  const action = argv['_'][0]

  switch (action) {
    case 'send':
      const { from, to, amount } = argv
      await cli.send(from, to, amount)
      break
    case 'balance':
      const { address } = argv
      const balance = await cli.getBalance(address)
      console.log(`Balance of ${red(address)}: ${green(balance)}`)
      break
    case 'print':
      const { start = 0, limit = 10 } = argv
      await cli.printChain(start, limit)
      break
    case 'transaction':
      const { id } = argv
      const tx = await cli.findTX(id)
      if (!tx) {
        console.log(red('Transaction not found'))
      } else {
        console.log(tx)
      }
      break
    case 'createwallet':
      await cli.createWallet()
      break
    case 'createblockchain':
      await cli.createBlockChain(argv.address)
      break
    case 'wallet':
      const { create, print } = argv
      if (print) {
        await cli.printWallets()
      }
      if (create) {
        await cli.createWallet()
      }
      break
    default:
      cli.greeting()
  }
}

main().catch((err) => {
  console.log(red(err.message))
  console.log(err)
})
