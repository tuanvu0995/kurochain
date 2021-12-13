/**
 *
 * @param {String} cmd
 * @returns {Array<String>}
 */
const cmdToArray = (cmd) => {
  if (typeof cmd !== 'string') {
    return cmd
  }
  return cmd.split(':')
}

module.exports = { cmdToArray }
