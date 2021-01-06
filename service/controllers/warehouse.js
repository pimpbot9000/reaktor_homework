const warehouseRouter = require('express').Router()
const axios = require('axios')
const config = require('../utils/config')
const xmlParser = require('xml2js').parseString

warehouseRouter.get('/products', (request, response) => {
  return response.status(200).send("Vaihtoehtoina ovat: /gloves, /facemasks ja /beanies").end()
})

warehouseRouter.get('/products/:category', async (request, response) => {

  //const id = request.params.id
  console.log(request.params)
  //const stopId = config.STOPS[id]

  //if (!stopId) return response.status(404).send("404: pysäkkiä ei löydy! vain munccalaisille. köyhä.").end()
  const category = request.params.category
  console.log("CATEGORY", category)

  const productUrl = config.API_URL + "/v2/products/" + category
  console.log(productUrl)

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
    console.log("error", e)
    response
      .status(500)
      .send('Server error no products found').end()
  }

  manufacturers = getManufacturers(products)
  manufacturerRequests = createRequests(manufacturers)

  try {

    let results = await axios.all(manufacturerRequests)

    dataArrays = results.map(item => item.data.response)

    resultti = createResult(buildMapOfAvailability(joinArrays(dataArrays)), products)

    response
      .status(200)
      .json(resultti)

  } catch (e) {
    console.log("error", e)
    response
      .status(500)
      .send('Server error: Availabilities not found').end()
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
      'Cache-Control': 'max-age=100'
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
      console.log(e)
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

