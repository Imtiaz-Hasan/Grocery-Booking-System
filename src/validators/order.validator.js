'use strict';

const Joi = require('joi');

const create = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        groceryId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).max(1000).required(),
      })
    )
    .min(1)
    .max(50)
    .unique('groceryId')
    .required()
    .messages({
      'array.unique': 'Duplicate groceryId in items — combine quantities into a single entry',
    }),
});

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled'),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { create, list, idParam };
