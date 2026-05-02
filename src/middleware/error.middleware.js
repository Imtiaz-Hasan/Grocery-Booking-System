'use strict';

const { ValidationError, UniqueConstraintError, DatabaseError, ForeignKeyConstraintError } = require('sequelize');
const ApiError = require('../utils/apiError');
const config = require('../config');
const logger = require('../utils/logger');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    error = ApiError.conflict(
      `Duplicate value for: ${fields.join(', ') || 'unique field'}`,
      err.errors?.map((e) => ({ field: e.path, message: e.message }))
    );
  } else if (err instanceof ValidationError) {
    error = ApiError.badRequest(
      'Validation error',
      err.errors?.map((e) => ({ field: e.path, message: e.message }))
    );
  } else if (err instanceof ForeignKeyConstraintError) {
    error = ApiError.badRequest('Foreign key constraint violation', { table: err.table });
  } else if (err instanceof DatabaseError) {
    error = ApiError.internal('Database error');
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || 500, err.message || 'Internal Server Error', null, false);
  }

  if (error.statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}] ${err.stack || err.message}`);
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] ${error.statusCode} - ${error.message}`);
  }

  const body = {
    success: false,
    message: error.message,
  };
  if (error.details) body.details = error.details;
  if (config.env !== 'production' && error.statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(body);
}

module.exports = { notFoundHandler, errorHandler };
