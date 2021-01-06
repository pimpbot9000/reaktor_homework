
const express = require('express')
const timetableRouter = require('./controllers/timetable')
const warehouseRouter = require('./controllers/warehouse')
const middleware = require('./utils/middleware')
const app = express()

app.use('/api', timetableRouter)
app.use('/warehouse', warehouseRouter)
app.use(middleware.unknownEndpoint)

module.exports = app
