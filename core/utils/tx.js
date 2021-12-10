/**
 * @param {Object} txOutput
 * @param {String} unlockingData
 * @return {Boolean}
 */
const canBeUnlockedWith = (txOutput, unlockingData) => {
  return txOutput.scriptPubKey === unlockingData
}

/**
 * @param {Object} txInput
 * @param {String} unlockingData
 * @return {Boolean}
 */
const canUnlockOutputWith = (txInput, unlockingData) => {
  return txInput.scriptSig === unlockingData
}

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

module.exports = {
  canBeUnlockedWith,
  canUnlockOutputWith,
  hasInputReferTo
}
