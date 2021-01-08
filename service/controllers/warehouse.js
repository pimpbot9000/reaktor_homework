const warehouseRouter = require('express').Router()
const redisClient = require('../redis/redis-client');
const axios = require('axios')
const config = require('../utils/config')
const xmlParser = require('xml2js').parseString
require('../utils/helpers')

const helpString = "Your options are: /gloves, /facemasks and /beanies"

warehouseRouter.get('/products', (request, response) => {
  return response.status(402).send(helpString).end()
})

warehouseRouter.get('/products/:category', async (request, response) => {

  const category = request.params.category
  let invalidateCache = false

  if (request.query.invalidate_cache === "true") {
    invalidateCache = true
  }

  if (!config.CATEGORIES.includes(category)) {
    return response
      .status(402)
      .send(helpString).end()
  }

  if (!invalidateCache) {

    let cacheResult = await redisClient.getAsync(category)

    if (cacheResult) {
      return response
        .status(200)
        .json(JSON.parse(cacheResult))
    }

  }

  result = await fetchProducts(category)

  if (result.products === null) {

    return response
      .status(500)
      .send(result.message).end()

  }

  products = result.products

  // get all manufacturers from the list of products and combine data

  manufacturers = getManufacturers(products)
  manufacturerRequests = createRequests(manufacturers)

  try {

    let results = await axios.all(manufacturerRequests)
    dataArrays = results.map(item => item.data.response)

    createResult(buildMapOfAvailability(concatArrays(dataArrays)), products)

    await redisClient.setAsync(category, JSON.stringify(products), 'EX', config.EXPIRATION)

    response
      .status(200)
      .json(result)

  } catch (e) {

    response
      .status(500)
      .send('Product inventories not found').end()

  }

})


const fetchProducts = async (category) => {

  try {

    const productUrl = config.API_BASE_URL + config.PRODUCTS_PATH + category
    let result = await createAxiosRequest(productUrl)
    products = result.data

    return { 'message': 'ok', 'products': products }

  } catch (e) {

    return { 'message': 'Server error', 'products': null }

  }

}

const getManufacturers = (products) => {
  manufactures = new Set()
  products.forEach(product => manufactures.add(product.manufacturer));
  return manufactures
}

const createRequests = (manufacturers) => {  
  axiosRequests = [...manufacturers].map(manufacturer => createAxiosRequest(config.API_BASE_URL + config.AVAILABILITY_PATH + manufacturer))
  return axiosRequests
}

createAxiosRequest = (url) => axios(
  {
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })


const concatArrays = (arrays) => {

  const reducer = (accumulator, currentValue) => accumulator.concat(currentValue);
  return arrays.reduce(reducer, [])

}

/**
 * Updates the array of products in place
 */
const createResult = (mapOfAvailability, products) => {  
  products.forEach(product => product.availability = mapOfAvailability.getOrElse(product.id, "NO_INFO"))  
}

/**
 * Build a map of (product key, availability) 
 * from availabilities data.
 */
const buildMapOfAvailability = (array) => {

  const map = new Map()

  array.forEach(item => {

    try {
      key = item.id.toLowerCase()
      map.set(key, parseAvailability(item.DATAPAYLOAD))
    } catch (e) {
      // do nothing
    }

  })

  return map
}

const parseAvailability = (xmlString) => {

  res = null

  xmlParser(xmlString, (err, result) => {
    if (err === null) res = result.AVAILABILITY.INSTOCKVALUE[0];
  });

  return res
}

module.exports = warehouseRouter

