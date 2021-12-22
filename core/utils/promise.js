const delay = (time = 1000) =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve()
    }, time)
  })

  module.exports = {
      delay
  }