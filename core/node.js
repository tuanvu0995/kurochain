const Commandline = require('../cli/cli')
const Database = require('./database')
const Block = require('./block')
const { delay } = require('./utils/promise')

const NODE_ADDRESS = 'localhost'
const NODE_PORT = 3000
const NODE_VERSION = 1

const knowNodes = ['localhost:3000']

const blocksInTransit = []

class Node {
  /**
   *
   * @param {Commandline} cli
   * @param {Object} config
   */
  constructor(cli, config) {
    this.cli = cli
    const tmpPath = config.tmp || './tmp'
    this.db = new Database(tmpPath + '/node')

    this.serve()
    this.connect()
  }

  serve() {
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => this.hanlderCmd(socket, data))
    })
    this.server.listen(this.config.port || NODE_PORT, NODE_ADDRESS)
    console.log('Node started!')
  }

  /**
   * @param {String} address
   */
  connect(address) {
    const socket = new net.Socket()
    socket.connect(this.port, gitaddress, () => {
      console.log('Connected to server')
      this.sendVersionCmd()
    })

    socket.on('data', (data) => this.hanlderCmd(socket, data))
    socket.on('close', () => console.log('Connection closed'))
  }

  /**
   * @param {net.Socket} socket
   * @param {Buffer} data
   */
  async hanlderCmd(socket, data) {
    const cmdStr = data.toString()
    console.log('Reveive: ', data.toString())
    const cmdArr = cmdToArray(cmdStr)

    if (!cmdArr.length) {
      return socket.write('ERROR: Invalid command')
    }
    console.log(cmdArr)

    switch (cmdArr[0]) {
      case 'version':
        const bestHeight = Number(cmdArr[2])
        const myBestHeight = await this.cli.blockChain.getBestHeight()
        if (myBestHeight > bestHeight) {
          this.sendVersion(socket)
        } else {
          this.sendGetBlockCmd(socket, bestHeight, myBestHeight + 1)
        }
        break
      case 'getblock':
        console.log('get block')
        await this.handleGetBlock(socket, Number(cmdArr[1]), Number(cmdArr[2]))
        break
      case 'regetblock':
        console.log('Receive block hashes')
        await this.receiveGetBlock(
          socket,
          cmdArr[1],
          Number(cmdArr[2]),
          Number(cmdArr[3])
        )
        break
      case 'getblockdata':
        await this.handleGetBlockdat(socket, cmdArr[1])
        break
      case 'regetblockdata':
        await this.receiveBlockData(cmdArr[1])
        break
      default:
        socket.write('ERROR: Unknown command!')
    }
  }

  /**
   * @param {net.Socket} socket
   * @param {String} address
   */
  async sendVersionCmd(socket) {
    const bestHeight = await this.cli.blockChain.getBestHeight()
    const payload = `version:${NODE_VERSION}:${bestHeight}:${NODE_ADDRESS}`
    socket.write(payload)
  }

  /**
   * @param {net.Socket} socket
   * @param {Number} startHeight
   * @param {Number} endHeight
   */
  async sendGetBlockCmd(socket, startHeight, endHeight) {
    socket.write(`getblock:${startHeight}:${endHeight}`)
  }

  /**
   * @param {net.Socket} socket
   */
  async startGetBlockData(socket) {
    for (let i = 0; i < blocksInTransit.length; i++) {
      const hash = blocksInTransit[i]
      socket.write(`getblockdata:${hash}`)
      await delay(200)
    }
  }

  /**
   * @param {String} blockData
   */
  async receiveBlockData(blockData) {
    const block = new Block()
    block.deserialize(blockData)
    await this.cli.blockChain.saveBlock(block)
    await this.cli.utxoSet.update(block)
    await this.cli.hashSet.update(block)
  }

  /**
   * @param {net.Socket} socket
   * @param {Number} startHeight
   * @param {Number} endHeight
   */
  async handleGetBlock(socket, startHeight, endHeight) {
    const blocks = await this.cli.blockChain.getBlocks(startHeight, endHeight)
    const hashes = blocks.map((block) => block.hash)
    socket.write(`regetblock:${hashes.join('|')}:${startHeight}:${endHeight}`)
  }

  /**
   * @param {net.Socket} socket
   * @param {String} blockHashes
   * @param {Number} startHeight
   * @param {Number} endHeight
   */
  async receiveGetBlock(socket, blockHashes, startHeight, endHeight) {
    const hashes = blockHashes.split('|')
    blocksInTransit.concat(hashes)
    if (startHeight > endHeight) {
      await this.sendGetBlockCmd(socket, startHeight, endHeight)
    } else {
      this.startGetBlockData(socket)
    }
  }

  /**
   * @param {net.Socket} socket
   * @param {String} hash
   */
  async handleGetBlockData(socket, hash) {
    const block = await this.cli.blockChain.getBlock(hash)
    if (block) {
      socket.write(`regetblockdata:${block.serialize()}`)
    }
  }
}

module.exports = Node
