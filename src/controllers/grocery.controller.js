'use strict';

const { Op } = require('sequelize');
const { Grocery } = require('../models');
const ApiError = require('../utils/apiError');
const { ok, created, noContent } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

function buildWhere(query, { forUser = false } = {}) {
  const where = {};
  if (query.search) {
    where.name = { [Op.iLike]: `%${query.search}%` };
  }
  if (query.category) {
    where.category = query.category;
  }
  if (typeof query.isActive === 'boolean') {
    where.isActive = query.isActive;
  } else if (forUser) {
    where.isActive = true;
  }
  if (query.inStock === true) {
    where.stock = { [Op.gt]: 0 };
  } else if (query.inStock === false) {
    where.stock = 0;
  }
  return where;
}

// ───── Admin ─────

async function adminCreate(req, res) {
  const grocery = await Grocery.create(req.body);
  return created(res, 'Grocery item created', grocery);
}

async function adminUpdate(req, res) {
  const grocery = await Grocery.findByPk(req.params.id);
  if (!grocery) throw ApiError.notFound('Grocery item not found');
  await grocery.update(req.body);
  return ok(res, 'Grocery item updated', grocery);
}

async function adminDelete(req, res) {
  const grocery = await Grocery.findByPk(req.params.id);
  if (!grocery) throw ApiError.notFound('Grocery item not found');
  await grocery.destroy();
  return noContent(res);
}

async function adminList(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = (req.query.sortOrder || 'desc').toUpperCase();

  const where = buildWhere(req.query, { forUser: false });
  const { rows, count } = await Grocery.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
  });

  return ok(res, 'Grocery items retrieved', rows, buildPaginationMeta({ page, limit, total: count }));
}

async function adminUpdateInventory(req, res) {
  const grocery = await Grocery.findByPk(req.params.id);
  if (!grocery) throw ApiError.notFound('Grocery item not found');

  const { operation, quantity } = req.body;
  let newStock = grocery.stock;
  if (operation === 'set') newStock = quantity;
  else if (operation === 'increment') newStock = grocery.stock + quantity;
  else if (operation === 'decrement') newStock = grocery.stock - quantity;

  if (newStock < 0) {
    throw ApiError.badRequest(`Decrement of ${quantity} would result in negative stock (current: ${grocery.stock})`);
  }

  await grocery.update({ stock: newStock });
  return ok(res, 'Inventory updated', {
    id: grocery.id,
    name: grocery.name,
    previousStock: operation === 'set' ? grocery.stock : grocery.stock,
    stock: grocery.stock,
  });
}

// ───── User / Public ─────

async function userList(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const sortBy = req.query.sortBy || 'name';
  const sortOrder = (req.query.sortOrder || 'asc').toUpperCase();

  const where = buildWhere(req.query, { forUser: true });
  const { rows, count } = await Grocery.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });

  return ok(res, 'Available grocery items', rows, buildPaginationMeta({ page, limit, total: count }));
}

async function userGet(req, res) {
  const grocery = await Grocery.findOne({
    where: { id: req.params.id, isActive: true },
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });
  if (!grocery) throw ApiError.notFound('Grocery item not found');
  return ok(res, 'Grocery item', grocery);
}

module.exports = {
  adminCreate,
  adminUpdate,
  adminDelete,
  adminList,
  adminUpdateInventory,
  userList,
  userGet,
};
