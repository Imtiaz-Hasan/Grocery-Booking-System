'use strict';

class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict', details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = 'Unprocessable Entity', details = null) {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;
