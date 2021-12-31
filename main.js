const minimist = require('minimist')
const BlockChain = require('./core/blockchain')
const Commandline = require('./cli/cli')
const { green, red } = require('colors')
const WalletManager = require('./core/walletManager')
const UTXOSet = require('./core/utxoset')
const Node = require('./core/node')

const main = async () => {
  const argv = minimist(process.argv.slice(2))
  const action = argv['_'][0]

  const config = {}
  if (argv.tmp) {
    config.tmp = argv.tmp
  }

  const walletManager = new WalletManager(config)
  await walletManager.loadFromDisk()
  const blockChain = new BlockChain(config)
  await blockChain.initBlockChain()
  const utxoSet = new UTXOSet(blockChain, config)

  const cli = new Commandline(blockChain, walletManager, utxoSet)

  switch (action) {
    case 'send':
      const { from, to, amount } = argv
      await cli.send(from, to, amount)
      break
    case 'balance':
      const { address, all } = argv
      if (all) {
        const balances = await cli.getAllAddressesBalance()
        console.log(green(`Found ${balances.length} wallets:`))
        balances.map((balance) =>
          console.log(
            `Balance of ${red(balance.address)}: ${green(balance.balance)}`
          )
        )
      } else {
        const balance = await cli.getBalance(address)
        console.log(`Balance of ${red(address)}: ${green(balance)}`)
      }

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
    case 'reindex':
      await cli.reindexUTXO()
      break
    case 'test':
      await cli.testCmd()
      break
    case 'serve':
      const { port, central } = argv
      const server = new Node(cli, {port, central})
      return { server }
    default:
      cli.greeting()
  }
}

main()
  .then((context) => {})
  .catch((err) => {
    console.log(red(err.message))
    console.log(err)
  })
