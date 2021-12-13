const axios = require('axios')

const createAxios = (url) => {
  const Api = axios.create({
    baseURL: url,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  })

  Api.interceptors.request.use(async (config) => {
    return config
  })

  Api.interceptors.response.use(
    async (response) => {
      return response.data
    },
    async (error) => {
      return Promise.reject(error)
    }
  )
  return Api
}

module.exports = createAxios
