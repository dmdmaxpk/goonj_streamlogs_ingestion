const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const config = require('./config');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to our Database:
mongoose.connect(config.mongoConnectionUrl, { useNewUrlParser: true });
mongoose.connection.on('error', err => console.error(`Error: ${err.message}`));

// import models
require('./models/LiveLog');
require('./models/VodLog');
require('./models/MsdnVodLog');

// Routes:
const routes = require('./routes/index');
app.use('/', routes);

// Starting App
let { port } = config;
app.listen( port, () => console.info(`APP running on port ${port}`));

module.exports = app;
