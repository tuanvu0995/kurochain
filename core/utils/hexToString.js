const convert = (from, to) => (str) => Buffer.from(str, from).toString(to)
const hexToString = convert('hex', 'utf8')

module.exports = {
  convert,
  hexToString,
}
