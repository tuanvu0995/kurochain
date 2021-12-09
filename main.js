const cli = require('./cli/cli')

const main = async () => {
  const balance = await cli.getBalance()
  console.log(balance)
}

main()
