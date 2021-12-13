const crypto = require('crypto')
const {
  hashPubKey,
  createPrivateKey,
  createPublicKey,
} = require('./utils/hash')
const { lock } = require('./utils/tx')
const UTXOSet = require('./utxoset')
const Wallet = require('./wallet')

const REWARD = 1000000
const MINING_REWARD = 10

class Transaction {
  /**
   *
   * @param {String} id
   * @param {Array<TXInput>} txIn
   * @param {Array<TXOutput>} txOut
   */
  constructor(id, txIn, txOut) {
    this.id = id
    this.vin = txIn
    this.vout = txOut
  }

  /**
   *
   * @param {Wallet} wallet
   * @param {Boolean} isMining
   * @returns {Transaction}
   */
  static NewCoinbaseTX(wallet, isMining = false) {
    const pubKeyHash = hashPubKey(wallet.publicKey)
    const txIn = {
      txId: '_',
      vout: -1,
      signature: null,
      pubKey: wallet.publicKey,
    }
    const txOut = { value: isMining ? MINING_REWARD : REWARD, pubKeyHash: pubKeyHash }
    const tx = new Transaction('_', [txIn], [txOut])
    tx.id = tx.hash()

    return tx
  }

  /**
   * @param {Wallet} from
   * @param {address} to
   * @param {Number} amount
   * @param {UTXOSet} utxoSet
   * @returns {Transaction}
   */
  static async NewUTXOTransaction(from, to, amount, utxoSet) {
    let inputs = []
    const outputs = []

    const { accumulated, unspentOutputs } = await utxoSet.findSpendableOutputs(
      from.getPubKeyHash(),
      amount
    )

    if (accumulated < amount) {
      throw new Error('ERROR: Not enough funds')
    }

    for (let txId in unspentOutputs) {
      const outs = unspentOutputs[txId]
      inputs = outs.map((out) => ({ txId, vout: out, pubKey: from.publicKey }))
    }
    const out = lock({ value: amount }, to)
    outputs.push(out)

    if (accumulated > amount) {
      outputs.push({
        value: accumulated - amount,
        pubKeyHash: from.getPubKeyHash(),
      })
    }

    const tx = new Transaction('', inputs, outputs)
    tx.id = tx.hash()
    await utxoSet.blockChain.signTransaction(tx, from.privateKey)

    return tx
  }

  hash() {
    const { id, vin, vout } = this
    const hashData = JSON.stringify({ id, vin: vin, vout: vout })
    return crypto.createHash('sha256').update(hashData).digest('hex')
  }

  /**
   * @returns {Boolean}
   */
  isCoinBase() {
    const { vin } = this
    return vin.length === 1 && vin[0].txId === '_' && vin[0].vout === -1
  }

  /**
   *
   * @param {String} privateKey
   * @param {Object} prevTXs
   * @returns
   */
  sign(privateKey, prevTXs) {
    if (this.isCoinBase()) {
      return
    }

    this.vin.map((_in) => {
      if (!prevTXs[_in.txId].id) {
        throw new Error('ERROR: Previous transaction is not correct')
      }
    })

    const txCopy = this.trimmedCopy()
    const privKeyObject = createPrivateKey(privateKey)

    for (let vix = 0; vix < this.vin.length; vix++) {
      const vin = this.vin[vix]
      const prevTx = prevTXs[vin.txId]

      txCopy.vin[vix].signature = null
      txCopy.vin[vix].pubKey = prevTx.vout[vin.vout].pubKeyHash
      txCopy.id = txCopy.hash()
      txCopy.vin[vix].pubKey = null

      const sign = crypto.createSign('SHA256')
      sign.update(txCopy.id)
      sign.end()
      const signature = sign.sign(privKeyObject, 'hex')

      this.vin[vix].signature = signature
    }
  }

  /**
   *
   * @param {Object} prevTXs
   * @returns {Boolean}
   */
  verify(prevTXs) {
    if (this.isCoinBase()) {
      return true
    }

    this.vin.map((_in) => {
      if (!prevTXs[_in.txId].id) {
        throw new Error('ERROR: Previous transaction is not correct')
      }
    })

    const txCopy = this.trimmedCopy()
    for (let vix = 0; vix < this.vin.length; vix++) {
      const vin = this.vin[vix]
      if (!vin.signature || !vin.pubKey) {
        return false
      }

      const prevTx = prevTXs[vin.txId]
      txCopy.vin[vix].signature = null
      txCopy.vin[vix].pubKey = prevTx.vout[vin.vout].pubKeyHash
      txCopy.id = txCopy.hash()
      txCopy.vin[vix].pubKey = null

      const verify = crypto.createVerify('SHA256')
      verify.update(txCopy.id)
      verify.end()

      const pubKeyBuffer = createPublicKey(vin.pubKey)
      if (!verify.verify(pubKeyBuffer, vin.signature, 'hex')) {
        return false
      }
    }

    return true
  }

  /**
   * @returns {Transaction}
   */
  trimmedCopy() {
    const inputs = this.vin.map((input) => ({
      txId: input.txId,
      vout: input.vout,
      signature: null,
      pubKey: null,
    }))
    return new Transaction('', inputs, [...this.vout])
  }

  static deserialize(tx) {
    return new Transaction(tx.id, tx.vin, tx.vout)
  }

  serialize() {
    return JSON.stringify({
      id: this.id,
      vin: JSON.stringify(this.vin),
      vout: JSON.stringify(this.vout),
    })
  }
}

module.exports = Transaction
