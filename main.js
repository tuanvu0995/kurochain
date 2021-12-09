const BlockChain = require('./core/blockchain')
const Commandline = require('./cli/cli')

const main = async () => {
  const blockChain = new BlockChain()
  await blockChain.initBlockChain('cookievu')
  const cli = new Commandline(blockChain)

  const balance = await cli.getBalance('cookievu')
  console.log("cookievu balance: ", balance)

  await cli.send('cookievu', "vu", 50)
  // await cli.send('cookievu', "huyen", 25)
  // await cli.send('vu', "huyen", 15)

  console.log("cookievu balance: ", await cli.getBalance('cookievu'))
  console.log("vu balance: ", await cli.getBalance('vu'))
  console.log("huyen balance: ", await cli.getBalance('huyen'))
}

main()
