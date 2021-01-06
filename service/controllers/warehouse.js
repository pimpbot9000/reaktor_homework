const warehouseRouter = require('express').Router()
const redisClient = require('../redis/redis-client');
const axios = require('axios')
const config = require('../utils/config')
const xmlParser = require('xml2js').parseString

warehouseRouter.get('/products', (request, response) => {
  return response.status(200).send("Vaihtoehtoina ovat: :gloves, :facemasks ja :beanies").end()
})

warehouseRouter.get('/products/:category', async (request, response) => {

  const category = request.params.category  

  let cacheResult = await redisClient.getAsync(category)  

  if (cacheResult) {

    console.log("found from cache")
    return response
      .status(200)
      .json(JSON.parse(cacheResult))

  } else {

    console.log("not found from cache")
    const productUrl = config.API_URL + "/v2/products/" + category

    products = null

    try {
      let result = await axios({
        url: productUrl,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      products = result.data

    } catch (e) {      
      response
        .status(500)
        .send('Server error no products found').end()
    }

    manufacturers = getManufacturers(products)
    manufacturerRequests = createRequests(manufacturers)


    try {

      let results = await axios.all(manufacturerRequests)

      dataArrays = results.map(item => item.data.response)

      result = createResult(buildMapOfAvailability(joinArrays(dataArrays)), products)

      console.log("Save to cache")
      await redisClient.setAsync(category, JSON.stringify(result), 'EX', config.EXPIRATION)

      response
        .status(200)
        .json(result)

    } catch (e) {
      
      response
        .status(500)
        .send('Server error: Availabilities not found').end()
    }

  }
})

const getManufacturers = (products) => {

  manufactures = new Set()
  products.forEach(product => manufactures.add(product.manufacturer));
  return manufactures
}

const createRequests = (manufacturers) => {
  axiosReqs = [...manufacturers].map(m => createAxiosRequest(config.API_URL + "/v2/availability/" + m))
  return axiosReqs
}

createAxiosRequest = (url) => {

  return axios({
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      //'Cache-Control': 'max-age=100'
    }
  })
}

const joinArrays = (arrays) => {

  const reducer = (accumulator, currentValue) => accumulator.concat(currentValue);
  return arrays.reduce(reducer, [])

}

const createResult = (mapOfAvailability, products) => {
  -
    products.forEach(product => product.availability = mapOfAvailability.get(product.id))
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

