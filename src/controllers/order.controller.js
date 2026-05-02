'use strict';

const { sequelize, Order, OrderItem, Grocery, User } = require('../models');
const ApiError = require('../utils/apiError');
const { ok, created } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { ORDER_STATUS } = require('../models/order.model');

async function createOrder(req, res) {
  const { items } = req.body;
  const userId = req.user.id;
  const groceryIds = items.map((i) => i.groceryId);

  const result = await sequelize.transaction(async (t) => {
    // Lock the rows for update to prevent concurrent overselling.
    const groceries = await Grocery.findAll({
      where: { id: groceryIds },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (groceries.length !== groceryIds.length) {
      const foundIds = new Set(groceries.map((g) => g.id));
      const missing = groceryIds.filter((id) => !foundIds.has(id));
      throw ApiError.notFound(`Grocery item(s) not found: ${missing.join(', ')}`);
    }

    const groceryMap = new Map(groceries.map((g) => [g.id, g]));
    const itemsPayload = [];
    let total = 0;

    for (const reqItem of items) {
      const grocery = groceryMap.get(reqItem.groceryId);

      if (!grocery.isActive) {
        throw ApiError.badRequest(`Grocery item "${grocery.name}" is not currently available`);
      }
      if (grocery.stock < reqItem.quantity) {
        throw ApiError.unprocessable(
          `Insufficient stock for "${grocery.name}". Requested: ${reqItem.quantity}, available: ${grocery.stock}`
        );
      }

      const unitPrice = grocery.price;
      const subtotal = +(unitPrice * reqItem.quantity).toFixed(2);
      total += subtotal;

      itemsPayload.push({
        groceryId: grocery.id,
        itemName: grocery.name,
        quantity: reqItem.quantity,
        unitPrice,
        subtotal,
      });

      // Deduct inventory.
      grocery.stock -= reqItem.quantity;
      await grocery.save({ transaction: t });
    }

    const order = await Order.create(
      {
        userId,
        totalAmount: +total.toFixed(2),
        status: ORDER_STATUS.CONFIRMED,
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      itemsPayload.map((p) => ({ ...p, orderId: order.id })),
      { transaction: t, validate: true }
    );

    return order.id;
  });

  const fullOrder = await Order.findByPk(result, {
    include: [{ model: OrderItem, as: 'items' }],
  });

  return created(res, 'Order placed successfully', fullOrder);
}

async function listMyOrders(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const where = { userId: req.user.id };
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: 'items' }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return ok(res, 'Orders retrieved', rows, buildPaginationMeta({ page, limit, total: count }));
}

async function getMyOrder(req, res) {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: OrderItem, as: 'items' }],
  });
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, 'Order retrieved', order);
}

// Admin
async function adminListOrders(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return ok(res, 'Orders retrieved', rows, buildPaginationMeta({ page, limit, total: count }));
}

async function adminGetOrder(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: OrderItem, as: 'items' },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
    ],
  });
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, 'Order retrieved', order);
}

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminGetOrder,
};
