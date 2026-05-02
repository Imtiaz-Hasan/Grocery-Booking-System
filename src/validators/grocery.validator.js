'use strict';

const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  description: Joi.string().trim().allow('', null).max(2000),
  category: Joi.string().trim().max(80).allow('', null),
  unit: Joi.string().trim().max(30).default('piece'),
  price: Joi.number().precision(2).min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(150),
  description: Joi.string().trim().allow('', null).max(2000),
  category: Joi.string().trim().max(80).allow('', null),
  unit: Joi.string().trim().max(30),
  price: Joi.number().precision(2).min(0),
  stock: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
}).min(1);

const updateInventory = Joi.object({
  operation: Joi.string().valid('set', 'increment', 'decrement').required(),
  quantity: Joi.number().integer().min(0).required(),
});

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).allow(''),
  category: Joi.string().trim().max(80).allow(''),
  inStock: Joi.boolean(),
  isActive: Joi.boolean(),
  sortBy: Joi.string().valid('name', 'price', 'stock', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { create, update, updateInventory, list, idParam };
