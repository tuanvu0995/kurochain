const { hashPubKey, base58Encode, base58Decode } = require("../hash")

test("hashPubKey: should return correct pubKeyHash with RIPEMD160 alg", () => {
    const pubKey = "testPubKey"
    const expectedPubKeyHash = 'f37616ebdd97343880e39fd78dcfae592f9e9f1d'
    expect(hashPubKey(pubKey)).toEqual(expectedPubKeyHash)
})

describe('base58', () => {
    test("encode", () => {
        const data = "test data"
        expect(base58Encode(data)).toEqual("2Uw1bpnsXxu3e")
    })

    test("decode", () => {
        const data = "2Uw1bpnsXxu3e"
        expect(base58Decode(data)).toEqual("test data")
    })
})