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

module.exports = {
  hashPubKey,
  base58Encode,
  base58Decode,
}
