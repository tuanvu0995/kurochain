const {validateAddress, checksum} = require('../wallet')

test("checksum: should return correct value", () => {
    const expectedChecksum = '4734dce9'
    const versionPayload = "008a06a43f50d6131b4eff177bf3905edc902615f4"
    expect(checksum(versionPayload)).toEqual(expectedChecksum)
})

test("validateAddress: should return true when receive correct address", () => {
    const address = 'bSLxHcuyxTdt359qFu55AnzTmR5XWghDRWExiADDeFJTCXkPY8uwefvyoViPjV7DQRk4'
    expect(validateAddress(address)).toBe(true)
})