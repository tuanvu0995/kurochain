const { DEFAULT_PORT, DEFAULT_ADDRESS } = require('./constants')
const express = require('express')
const { green } = require('colors')
const Commandline = require('../cli/cli')

class ApiServer {
  /**
   * @param {Commandline} cli
   * @param {Number} port
   * @param {String} address
   */
  constructor(cli, port = DEFAULT_PORT, address = DEFAULT_ADDRESS) {
    this.cli = cli
    this.port = port
    this.address = address

    this.app = express()
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
  }

  serve() {
    this.app.listen(this.port, () => {
      console.log(
        green(`API Server running at http://${this.address}:${this.port}`)
      )
    })

    this.app.get('/', (req, res) => {
      res.send('Kurocoin API')
    })

    this.app.get('/ping', (req, res) => {
      res.send('Ping')
    })

    this.app.get('/wallet', async (req, res) => {
      const wallets = await this.cli.getAllAddressesBalance()
      res.json({ wallets })
    })

    this.app.get('/wallet/:address', async (req, res) => {
      const { address } = req.params
      const wallet = await this.cli.getWallet(address)
      res.json({ wallet })
    })

    this.app.post('/send', async (req, res) => {
      const { from, to, amount } = req.body
      const transactionId = await this.cli.send(from, to, Number(amount))
      res.json({
        transactionId,
      })
    })

    this.app.post('/wallet', async (req, res) => {
      const address = await this.cli.createWallet()
      res.json({
        address,
        balance: 0,
      })
    })
  }
}

module.exports = ApiServer
