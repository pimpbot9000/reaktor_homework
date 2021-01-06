const timetableRouter = require('express').Router()
const axios = require('axios')
const config = require('../utils/config')

timetableRouter.get('/', (request, response) => {
  return response.status(200).send("Vaihtoehtoina ovat: /portti, /alepa ja /paattari").end()
})

timetableRouter.get('/:id', async (request, response) => {

  const id = request.params.id

  const stopId = config.STOPS[id]

  if (!stopId) return response.status(404).send("404: pysäkkiä ei löydy! vain munccalaisille. köyhä.").end()

  try {
    let result = await axios({
      url: config.API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/graphql'
      },
      data: `{      
        stop(id: "HSL:${stopId}") {          
            stoptimesWithoutPatterns {
              scheduledArrival
              realtimeArrival
              arrivalDelay
              scheduledDeparture
              realtimeDeparture
              departureDelay
              realtime
              realtimeState
              serviceDay
              headsign
              trip{
                tripHeadsign
                routeShortName
              }   
          }
        }          
      }`
    })

    const arrivals = result.data.data.stop.stoptimesWithoutPatterns

    const arrivalTimes = arrivals.map(time => {
      return {
        departureInMinutes: calculateMinutes(time),
        departureInSeconds: calculateSeconds(time),
        description: time.headsign,
        sign: time.trip.tripHeadsign,
        route: time.trip.routeShortName
      }
    }).filter(t => t.departureInSeconds >= 0)
    
    response
      .status(200)
      .json(arrivalTimes)

  } catch (e) {
    response
      .status(500)
      .send('Server error').end()
  }
})

const calculateMinutes = (time) => {
  timeInMinutes = calculateSeconds(time) / 60
  return Math.round(timeInMinutes)
}

const calculateSeconds = (time) => {
  const currentTime = new Date().getTime()
  return Math.round((time.realtimeDeparture + time.serviceDay) - currentTime / 1000)
}
module.exports = timetableRouter

