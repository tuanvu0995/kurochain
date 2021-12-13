const base58 = require('bs58')
const crypto = require('crypto')

const hashPubKey = (pubKey) => {
  const publicSHA256 = crypto.createHash('sha256').update(pubKey).digest('hex')
  const publicRIPEMD160 = crypto
    .createHash('ripemd160')
    .update(publicSHA256)
    .digest('hex')
  return publicRIPEMD160
}

/**
 * @param {String} data
 * @returns {String}
 */
const base58Encode = (data) => {
  return base58.encode(Buffer.from(data))
}

/**
 * @param {String} data
 * @returns {String}
 */
const base58Decode = (data) => {
  return base58.decode(data).toString()
}

/**
 * @param {String} privateKey
 * @returns {PrivateKeyObject}
 */
const createPrivateKey = (privateKey) => {
  return crypto.createPrivateKey({
    key: Buffer.from(privateKey, 'hex'),
    format: 'der',
    type: 'pkcs8',
  })
}

/**
 * 
 * @param {String} pubKey 
 * @returns {PrivateKeyObject}
 */
const createPublicKey = (pubKey) => {
  return crypto.createPublicKey({
    key: Buffer.from(pubKey, 'hex'),
    format: 'der',
    type: 'spki',
  })
}

module.exports = {
  hashPubKey,
  base58Encode,
  base58Decode,
  createPrivateKey,
  createPublicKey
}
