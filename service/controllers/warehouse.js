const warehouseRouter = require('express').Router()
const redisClient = require('../redis/redis-client');
const axios = require('axios')
const config = require('../utils/config')
const xmlParser = require('xml2js').parseString
require('../utils/helpers')

warehouseRouter.get('/products', (request, response) => {
  return response.status(402).send("Your options are: /gloves, /facemasks and /beanies").end()
})

warehouseRouter.get('/products/:category', async (request, response) => {

  const category = request.params.category
  let invalidateCache = false

  if (request.query.invalidate_cache) {
    invalidateCache = true
  }

  if (!config.CATEGORIES.includes(category)) {
    return response
      .status(402)
      .send('No content').end()
  }

  if (!invalidateCache) {

    let cacheResult = await redisClient.getAsync(category)

    if (cacheResult) {
      return response
        .status(200)
        .json(JSON.parse(cacheResult))
    }

  }
  
  products = null

  try {

    const productUrl = config.API_BASE_URL + config.PRODUCTS_PATH + category
    let result = await createAxiosRequest(productUrl)
    products = result.data

  } catch (e) {

    console.log(e)
    return response
      .status(500)
      .send('Server error no products found').end()
  }

  // get all manufacturers from the list of products
  manufacturers = getManufacturers(products)
  manufacturerRequests = createRequests(manufacturers)

  try {

    let results = await axios.all(manufacturerRequests)

    dataArrays = results.map(item => item.data.response)

    result = createResult(buildMapOfAvailability(concatArrays(dataArrays)), products)
    
    await redisClient.setAsync(category, JSON.stringify(result), 'EX', config.EXPIRATION)

    response
      .status(200)
      .json(result)

  } catch (e) {

    console.log(e)
    response
      .status(500)
      .send('Product inventories not found').end()

  }


})

const fectchProducts = () => {  

  try {

    const productUrl = config.API_BASE_URL + config.PRODUCTS_PATH + category
    let result = await createAxiosRequest(productUrl)
    products = result.data
    return {'status': 'ok', 'result': products}

  } catch (e) {

    return {'status': 'Server error', 'result': null}

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

createAxiosRequest = (url) => {

  return axios({
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

const concatArrays = (arrays) => {

  const reducer = (accumulator, currentValue) => accumulator.concat(currentValue);
  return arrays.reduce(reducer, [])

}

const createResult = (mapOfAvailability, products) => {
  products.forEach(product => product.availability = mapOfAvailability.getOrElse(product.id, "NO_INFO"))
  return products
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

