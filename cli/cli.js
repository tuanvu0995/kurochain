const BlockChain = require('../core/blockchain')

const blockChain = new BlockChain()
blockChain.initBlockChain('cookievu')

const getBalance = async (address) => {
  const UTXOs = blockChain.findUTXO(address)
  const balance = UTXOs.map((out) => out.value).reduce((pv, cv) => pv + cv, 0)
  return balance
}

module.exports = {
    getBalance
}