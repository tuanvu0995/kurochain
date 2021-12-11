const bs58 = require('bs58')
const { ADDRESS_CHECKSUM_LENGTH } = require('../constants')
const { hashPubKey, base58Decode } = require('./hash')

/**
 *
 * @param {Array} inputs
 * @param {Number} outIndex
 * @returns {Boolean}
 */
const hasInputReferTo = (inputs, outIndex) => {
  for (let index = 0; index < inputs.length; index++) {
    if (inputs[index] === outIndex) {
      return true
    }
  }
  return false
}

/**
 *
 * @param {Object} input
 * @param {String} pubKeyHash
 * @returns {Boolean}
 */
const usesKey = (input, pubKeyHash) => {
  const lockingHash = hashPubKey(input.pubKey)
  return lockingHash === pubKeyHash
}

/**
 *
 * @param {Object} out
 * @param {String} address
 * @returns {Object}
 */
const lock = (out, address) => {
  const pubKeyHash = base58Decode(address)
  out.pubKeyHash = pubKeyHash.substr(
    2,
    (pubKeyHash.length - ADDRESS_CHECKSUM_LENGTH)-2
  )
  return out
}

/**
 *
 * @param {Object} out
 * @param {String} pubKeyHash
 * @returns {Boolean}
 */
const isLockedWithKey = (out, pubKeyHash) => {
  return out.pubKeyHash === pubKeyHash
}

module.exports = {
  hasInputReferTo,
  usesKey,
  lock,
  isLockedWithKey,
}
