const { lock, usesKey, isLockedWithKey, hasInputReferTo } = require('../tx')

test('lock: should return TXOut with correct pubKeyHash', () => {
  const address =
    'bSLoo5dGbUvKVcFtmWLeeQCfs7mvgXgTFyBVcaomBUWdzkpNCVyvVrRbFciXgeRkmQWN'
  const expectedPubKeyHash = '4cc94871f0c96670da492e8cba3a593578dea510'
  const out = { value: 100 }
  const result = lock(out, address)
  expect(result.pubKeyHash).toEqual(expectedPubKeyHash)
})

describe('usesKey', () => {
  test('should return true when pubKeyHash == input', () => {
    const pubKeyHash = 'f37616ebdd97343880e39fd78dcfae592f9e9f1d'
    const input = { txId: '', vout: 1, signature: '', pubKey: 'testPubKey' }
    expect(usesKey(input, pubKeyHash)).toEqual(true)
  })

  test('should return false when pubKeyHash != input', () => {
    const pubKeyHash = 'test'
    const input = { txId: '', vout: 1, signature: '', pubKey: 'testPubKey' }
    expect(usesKey(input, pubKeyHash)).toEqual(false)
  })
})

describe('hasInputReferTo', () => {
  test('should return true when output has pointed by an input', () => {
    const inputs = [0, 1, 2]
    const outputIndex = 1
    expect(hasInputReferTo(inputs, outputIndex)).toBe(true)
  })
  test('should return false when output not pointed by an input', () => {
    const inputs = [0, 1, 2]
    const outputIndex = 4
    expect(hasInputReferTo(inputs, outputIndex)).toBe(false)
  })
})

test('isLockedWithKey: should return true when out.pubKeyHash === input pubKeyHash', () => {
  const expectedPubKeyHash = 'f37616ebdd97343880e39fd78dcfae592f9e9f1d'
  const out = {
    value: 100,
    pubKeyHash: expectedPubKeyHash,
  }
  expect(isLockedWithKey(out, expectedPubKeyHash)).toEqual(true)
})
