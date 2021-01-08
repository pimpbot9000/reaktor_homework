
const express = require('express')
const warehouseRouter = require('./controllers/warehouse')
const middleware = require('./utils/middleware')
const app = express()

app.use('/warehouse', warehouseRouter)
app.use(middleware.unknownEndpoint)

module.exports = app
