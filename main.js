const BlockChain = require('./core/blockchain')
const BlockchainIterator = require('./core/iterator')

const main = async () => {
  const blockChain = new BlockChain()
  blockChain.initBlockChain("cookievu")

  const bci = new BlockchainIterator(blockChain.tip, blockChain.db)

  while (true) {
    const block = await bci.next()
    console.log(block)
    if (!block.prevHash?.length) {
      break
    }
  }
}

main()
