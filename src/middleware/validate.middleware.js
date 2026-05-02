'use strict';

const ApiError = require('../utils/apiError');

const TARGETS = ['body', 'query', 'params'];

function validate(schema, target = 'body') {
  if (!TARGETS.includes(target)) {
    throw new Error(`Invalid validation target: ${target}`);
  }

  return (req, _res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    req[target] = value;
    next();
  };
}

module.exports = validate;
