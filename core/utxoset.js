const BlockChain = require('./blockchain')
const Block = require('./block')
const Database = require('./database')
const { isLockedWithKey } = require('./utils/tx')

class UTXOSet {
  /**
   *
   * @param {BlockChain} blockChain
   * @param {Object} config
   */
  constructor(blockChain, config) {
    const tmpPath = config.tmp || './tmp'
    this.db = new Database(tmpPath + '/uxto')
    this.blockChain = blockChain
  }

  async reindex() {
    await this.db.clear()
    const UXTO = await this.blockChain.findUTXO()

    for (let txId in UXTO) {
      console.log('Indexing ' + txId)
      await this.db.put(txId, JSON.stringify(UXTO[txId]))
    }
  }

  /**
   * @param {Block} block
   */
  async update(block) {
    for (let txIx = 0; txIx < block.transactions.length; txIx++) {
      const tx = block.transactions[txIx]
      if (!tx.isCoinBase()) {
        for (let vinIx = 0; vinIx < tx.vin.length; vinIx++) {
          const _in = tx.vin[vinIx]
          const updatedOuts = []
          const outStr = await this.db.get(_in.txId)
          const outs = JSON.parse(outStr)

          outs.map((out, index) => {
            if (index !== _in.vout) {
              updatedOuts.push(out)
            }
          })

          if (!updatedOuts.length) {
            await this.db.delete(_in.txId)
          } else {
            await this.db.put(_in.txId, JSON.stringify(updatedOuts))
          }
        }
      }

      const newOutputs = []
      tx.vout.map((out) => newOutputs.push(out))
      this.db.put(tx.id, JSON.stringify(newOutputs))
    }
  }

  /**
   *
   * @param {String} pubKeyHash
   * @param {Number} amount
   * @returns {{accumulated: Number, unspentOutputs: Object}}
   */
  async findSpendableOutputs(pubKeyHash, amount) {
    const unspentOutputs = {}
    let accumulated = 0

    for await (const [txId, vout] of this.db.iterator()) {
      const ouputs = JSON.parse(vout)
      ouputs.map((out, index) => {
        if (isLockedWithKey(out, pubKeyHash) && accumulated < amount) {
          if (!unspentOutputs[txId]) {
            unspentOutputs[txId] = []
          }
          accumulated += out.value
          unspentOutputs[txId].push(index)
        }
      })
    }

    return { accumulated, unspentOutputs }
  }

  /**
   * @param {String} pubKeyHash
   * @returns{Array}
   */
  async findUTXO(pubKeyHash) {
    const UTXOs = []
    for await (const [txId, vout] of this.db.iterator()) {
      const ouputs = JSON.parse(vout)

      ouputs.map((out) => {
        if (isLockedWithKey(out, pubKeyHash)) {
          UTXOs.push(out)
        }
      })
    }
    return UTXOs
  }

  
}

module.exports = UTXOSet
