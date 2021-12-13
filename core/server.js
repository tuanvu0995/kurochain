const net = require('net')
const Commandline = require('../cli/cli')
const { cmdToArray } = require('./utils/cmd')

const commandLength = 12

const nodeAddress = 'localhost'
const nodeVersion = 1

const knownNodes = ['localhost:3001']
const mempool = []

class Server {
  /**
   * @param {Commandline}
   * @param {Number} port
   */
  constructor(cli, port = 3000) {
    this.cli = cli
    this.port = port
    this.createServer(port)
  }

  createServer() {
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => this.hanlderCmd(socket, data))
    })
    this.server.listen(this.port, nodeAddress)
    console.log('Server started!')
  }

  /**
   * @param {net.Socket} socket
   * @param {Buffer} data
   */
  async hanlderCmd(socket, data) {
    const cmdStr = data.toString()
    console.log('Clent send: ', data.toString())
    const cmdArr = cmdToArray(cmdStr)

    if (!cmdArr.length) {
      return socket.write('ERROR: Invalid command')
    }
    console.log(cmdArr)

    switch (cmdArr[0]) {
      case 'version':
        this.sendVersion(socket)
        break
      case 'getblock':
        console.log('get block')
        await this.handleGetBlock(socket)
        break
      default:
        socket.write('ERROR: Unknown command!')
    }
  }

  /**
   * @param {net.Socket} socket
   * @param {String} address
   */
   async sendVersion(socket) {
    const bestHeight = await this.cli.blockChain.getBestHeight()
    const payload = `reversion:${nodeVersion}:${bestHeight}:${nodeAddress}`
    socket.write(payload)
  }

  /**
   * @param {net.Socket} socket
   */
  async handleGetBlock(socket) {
    const blockHashes = await this.cli.blockChain.getBlockHashes()
    socket.write('regetblock:' + blockHashes.join('|'))
  }
}

module.exports = Server
