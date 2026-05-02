'use strict';

const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .message('"password" must be at least 8 chars and contain a letter and a number');

const register = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: passwordRule.required(),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(1).required(),
});

module.exports = { register, login };
