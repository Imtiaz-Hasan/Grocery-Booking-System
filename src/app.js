'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (config.env !== 'test') {
  app.use(
    morgan(config.env === 'development' ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.http ? logger.http(msg.trim()) : logger.info(msg.trim()) },
    })
  );
}

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(config.apiPrefix, limiter);

app.get('/', (_req, res) => {
  res.json({
    name: 'Grocery Booking System API',
    version: '1.0.0',
    apiPrefix: config.apiPrefix,
    docs: `${config.apiPrefix}/health`,
  });
});

app.use(config.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
