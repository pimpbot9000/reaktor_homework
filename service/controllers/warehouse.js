const warehouseRouter = require('express').Router()
const redisClient = require('../redis/redis-client');
const axios = require('axios')
const config = require('../utils/config')
const xmlParser = require('xml2js').parseString
const { zip, flattenArrays } = require('../utils/helpers')

const helpString = "Your options are: /gloves, /facemasks and /beanies"

warehouseRouter.get('/products', (_, response) => {
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

    const cacheResult = await redisClient.getAsync(category)

    if (cacheResult) {
      return response
        .status(200)
        .json(JSON.parse(cacheResult))
    }

  }

  const result = await fetchData(category)

  if (!result.data) {
    return response
      .status(500)
      .send(result.message)
      .end()
  }

  await redisClient.setAsync(category, JSON.stringify(result.data), 'EX', config.EXPIRATION)

  console.log("Data fetched and cached")

  return response
    .status(200)
    .json(result.data)

})

const fetchData = async (category) => {

  const result = await fetchProducts(category)

  if (result.data === null) {
    return result
  }

  const products = result.data

  let manufacturers = getManufacturers(products)


  let inventory = []

  // loop until data is received from all manufacturers
  while (manufacturers.length > 0) {

    let res = null
    try {
      res = await fetchInventories(manufacturers)
    } catch (e) {
      return { 'message': 'Server error', 'data': null }
    }

    inventory = flattenArrays([inventory, res.data])
    manufacturers = res.failed
  }

  // populate products with inventory data
  createResult(buildInventoryMap(inventory), products)

  return { 'message': 'ok', 'data': products }

}



const fetchInventories = async (manufacturers) => {

  const manufacturerRequests = createRequests(manufacturers)

  try {

    const responses = (await axios.all(manufacturerRequests)).map(result => result.data.response)

    zipped = zip(manufacturers, responses)

    inventoryArrays = zipped.filter(item => typeof (item[1]) === 'object').map(item => item[1])
    failed = zipped.filter(item => typeof (item[1]) === 'string').map(item => item[0]) // error happened

    if (failed.length != 0) {
      console.log('Failed to get inventory from manufacturers', failed, 'retrying....')
    }

    return { 'data': flattenArrays(inventoryArrays), 'failed': failed }

  } catch (e) {
    throw e
  }

}

const fetchProducts = async (category) => {

  try {

    const productUrl = config.API_BASE_URL + config.PRODUCTS_PATH + category
    let result = await createAxiosRequest(productUrl)
    products = result.data

    return { 'message': 'ok', 'data': products }

  } catch (e) {

    return { 'message': 'Server error', 'data': null }

  }

}

const getManufacturers = (products) => {
  manufactures = new Set()
  products.forEach(product => manufactures.add(product.manufacturer));
  return [...manufactures]
}

const createRequests = (manufacturers) => {
  axiosRequests = manufacturers.map(manufacturer => createAxiosRequest(config.API_BASE_URL + config.AVAILABILITY_PATH + manufacturer))
  return axiosRequests
}

createAxiosRequest = (url) => axios(
  {
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })


/**
 * Updates the array of products in place
 */
const createResult = (inventoryMap, products) => {
  products.forEach(product => product.availability = inventoryMap.getOrElse(product.id, 'NO_INFO'))
}

/**
 * Build a map of (product id -> availability) 
 */
const buildInventoryMap = (array) => {

  const map = new Map()

  array.forEach(item => {

    try {
      key = item.id.toLowerCase()
      map.set(key, parseAvailability(item.DATAPAYLOAD))
    } catch (e) {
      // do nothing, _should_ not happend
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

