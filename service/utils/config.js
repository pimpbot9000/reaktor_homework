require('dotenv').config()

let PORT = process.env.PORT || 3000

const API_URL = 'https://bad-api-assignment.reaktor.com'

module.exports = {
  API_URL, PORT
}