const express = require('express');
const httpErrors = require('http-errors');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
Joi.ObjectId = require('joi-objectid')(Joi);

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// END POINT
app.use('/api', require('./routes/index'));

/* 404 Error Handler */
app.use((req, res, next) => next(httpErrors.NotFound()));

/* Global Error Handler */
app.use((error, req, res, next) => {
  if (error.status === 404)
    return res.status(404).json({
      success: false,
      error: error.message || 'Not Found.',
      statusCode: 404,
    });
  else
    return res.status(error.status || 500).json({
      success: false,
      statusCode: error.status || 500,
      error: error.message || 'Internal Server Error.',
    });
});

module.exports = app;
