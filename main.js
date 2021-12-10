const BlockChain = require('./core/blockchain')
const Commandline = require('./cli/cli')
const BlockchainIterator = require('./core/iterator')

const main = async () => {
  const blockChain = new BlockChain()
  await blockChain.initBlockChain('cookievu')
  const cli = new Commandline(blockChain)

  const bci = new BlockchainIterator(blockChain.tip, blockChain.db)
  while (true) {
    const block = await bci.next()
    block.transactions.map((tx) => {
      console.log({id: tx.id, vin: tx.vin, out: tx.vout})
    })

    if (!block.prevHash.length) {
      break
    }
  }

  await cli.send('cookievu', "vu", 50)
  // await cli.send('cookievu', "huyen", 25)
  // await cli.send('vu', "huyen", 15)

  console.log("cookievu balance: ", await cli.getBalance('cookievu'))
  console.log("vu balance: ", await cli.getBalance('vu'))
  console.log("huyen balance: ", await cli.getBalance('huyen'))
}

main()
