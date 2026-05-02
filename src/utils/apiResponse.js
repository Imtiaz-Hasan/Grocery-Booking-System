'use strict';

function success(res, statusCode, message, data = null, meta = null) {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function ok(res, message, data, meta) {
  return success(res, 200, message, data, meta);
}

function created(res, message, data) {
  return success(res, 201, message, data);
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = { success, ok, created, noContent };
