const crypto = require('crypto')
const { ADDRESS_CHECKSUM_LENGTH } = require('../constants')
const { base58Decode } = require('./hash')

/**
 * @param {String} payload
 * @returns {String}
 */
const checksum = (payload) => {
  const firstSHA = crypto.createHash('sha256').update(payload).digest('hex')
  const secondSHA = crypto.createHash('sha256').update(firstSHA).digest('hex')
  return secondSHA.slice(0, ADDRESS_CHECKSUM_LENGTH)
}

const validateAddress = (address) => {
  const pubKeyHash = base58Decode(address)
  const actualChecksum = pubKeyHash.substring(pubKeyHash.length - ADDRESS_CHECKSUM_LENGTH)
  const versionPayload = pubKeyHash.substr(0, pubKeyHash.length - ADDRESS_CHECKSUM_LENGTH)
  const targetChecksum = checksum(versionPayload)
  return targetChecksum === actualChecksum
}

module.exports = { validateAddress, checksum }
