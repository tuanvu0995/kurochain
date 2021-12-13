const net = require('net')
const Commandline = require('../cli/cli')
const { cmdToArray } = require('./utils/cmd')

const nodeVersion = 1
const nodeAddress = 'localhost:3001'

class Client {
  /**
   * @param {Commandline} cli
   * @param {String} address example: localhost:3000
   */
  constructor(cli, address) {
    console.log(address)
    this.cli = cli
    const addr = address.split(':')
    this.port = addr[1]
    this.address = addr[0]

    this.createClient()
  }

  /**
   * @param {String} address
   */
  createClient(address) {
    this.socket = new net.Socket()
    this.socket.connect(this.port, this.address, () => {
      console.log('Connected to server')
      this.sendVersionCmd()
    })

    this.socket.on('data', (data) => {
      console.log('Received: ' + data.toString())
      this.hanlderCmd(data.toString())
    })

    this.socket.on('close', () => {
      console.log('Connection closed')
    })
  }

  /**
   * @param {Buffer} data
   */
  async hanlderCmd(data) {
    const cmdArr = cmdToArray(data)

    if (cmdArr.length < 2) {
       this.socket.write('ERROR: Invalid command')
       return
    }
    console.log(cmdArr)

    switch (cmdArr[0]) {
      case 'reversion':
        const bestHeight = Number(cmdArr[2])
        const myBestHeight = await this.cli.blockChain.getBestHeight()
        if (bestHeight > myBestHeight) {
          this.sendGetBlockCmd()
        }
        break
      case 'regetblock':
        console.log("Block hashes: ", cmdArr[1])
        break
      default:
        console.log('Got unknown command from server')
    }
  }

  async sendVersionCmd() {
    const bestHeight = await this.cli.blockChain.getBestHeight()
    const payload = `version:${nodeVersion}:${bestHeight}:${nodeAddress}`
    this.socket.write(payload)
  }

  async sendGetBlockCmd() {
    this.socket.write(`getblock`)
  }
}

module.exports = Client
