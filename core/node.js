const net = require('net')
const Commandline = require('../cli/cli')
const Database = require('./database')
const Block = require('./block')
const { delay } = require('./utils/promise')
const { cmdToArray } = require('./utils/cmd')

const NODE_ADDRESS = '0.0.0.0'
const NODE_PORT = 3000
const NODE_VERSION = 1

const MAX_HASHES_LENGTH = 10

const knowNodes = ['192.168.1.23:3000']

const blocksInTransit = []

class Node {
  /**
   * @param {Commandline} cli
   * @param {Object} config
   */
  constructor(cli, config) {
    this.cli = cli
    this.config = config
    if (!this.config.port) {
      this.config.port = NODE_PORT
    }
    const tmpPath = config.tmp || './tmp'
    this.db = new Database(tmpPath + '/node')

    this.central = Boolean(config?.central)

    this.serve()
    if (!this.central) {
      this.connect()
    }
  }

  serve() {
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => this.hanlderCmd(socket, data))
    })
    this.server.listen(this.config.port, NODE_ADDRESS)
    console.log('Node started!')
  }

  connect() {
    const socket = new net.Socket()
    const [address, port] = knowNodes[0].split(':')
    socket.connect(port, address, () => {
      console.log('Connected to server')
      this.sendVersionCmd(socket)
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
    console.log('CMD STR: ', cmdStr)

    const cmdArr = cmdToArray(cmdStr)
    console.log(cmdArr)

    if (!cmdArr.length) {
      return socket.write('ERROR: Invalid command')
    }

    switch (cmdArr[0]) {
      case 'version':
        const senderAddress = cmdArr[3] + ':' + cmdArr[4]
        if (!knowNodes.includes(senderAddress)) {
          knowNodes.push(senderAddress)
        }
        const bestHeight = Number(cmdArr[2])
        const myBestHeight = await this.cli.blockChain.getBestHeight()
        if (myBestHeight > bestHeight) {
          this.sendVersionCmd(socket)
        } else {
          const fromHeight = bestHeight
          const toHeight =
            bestHeight - myBestHeight > 20
              ? bestHeight - MAX_HASHES_LENGTH
              : myBestHeight + 1
          this.sendGetBlockCmd(socket, fromHeight, toHeight)
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
      case 'ERROR':
        console.log('Client send error: ', cmdArr)
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
    const payload = `version:${NODE_VERSION}:${bestHeight}:${NODE_ADDRESS}:${this.config.port}`
    socket.write(payload)
  }

  /**
   * @param {net.Socket} socket
   * @param {Number} fromHeight
   * @param {Number} toHeight
   */
  async sendGetBlockCmd(socket, fromHeight, toHeight) {
    socket.write(`getblock:${fromHeight}:${toHeight}`)
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
   * @param {Number} fromHeight
   * @param {Number} toHeight
   */
  async handleGetBlock(socket, fromHeight, toHeight) {
    const hashes = await this.cli.blockChain.getHashes(fromHeight, toHeight)
    socket.write(`regetblock:${hashes.join('|')}:${fromHeight}:${toHeight}`)
  }

  /**
   * @param {net.Socket} socket
   * @param {String} blockHashes
   * @param {Number} fromHeight
   * @param {Number} toHeight
   */
  async receiveGetBlock(socket, blockHashes, fromHeight, toHeight) {
    const myBestHeight = await this.cli.blockChain.getBestHeight()
    const hashes = blockHashes.split('|')
    blocksInTransit.concat(hashes)
    if (myBestHeight < toHeight) {
      const targetHeight = toHeight - MAX_HASHES_LENGTH - 1
      await this.sendGetBlockCmd(
        socket,
        fromHeight - MAX_HASHES_LENGTH - 1,
        targetHeight < 0 ? 0 : targetHeight
      )
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
