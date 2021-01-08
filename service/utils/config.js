require('dotenv').config()

let PORT = process.env.PORT || 3000
const API_BASE_URL = 'https://bad-api-assignment.reaktor.com'
const PRODUCTS_PATH = '/v2/products/'
const AVAILABILITY_PATH = '/v2/availability/'
const EXPIRATION = 300
const CATEGORIES = ["beanies", "facemasks", "gloves"]

module.exports = {
  API_BASE_URL, PORT, EXPIRATION, PRODUCTS_PATH, AVAILABILITY_PATH, CATEGORIES
}