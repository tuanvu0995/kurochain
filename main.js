const minimist = require('minimist')
const BlockChain = require('./core/blockchain')
const Commandline = require('./cli/cli')
const { green, red } = require('colors')

const main = async () => {
  const blockChain = new BlockChain()
  await blockChain.initBlockChain('cookievu')
  const cli = new Commandline(blockChain)
  
  const argv = minimist(process.argv.slice(2));
  const action = argv["_"][0]

  switch (action) {
    case "send":
      const {from, to, amount} = argv
      await cli.send(from, to, amount)
      break
    case 'balance':
      const {address} = argv
      const balance = await cli.getBalance(address)
      console.log(`Address: ${red(address)} \nBalance: ${green(balance)}`)
      break
    case "print":
      await cli.printChain()
      break
    default:
      cli.greeting()
  }
}

main()
