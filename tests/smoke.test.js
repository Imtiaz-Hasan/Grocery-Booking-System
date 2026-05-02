'use strict';

/**
 * Lightweight smoke tests — they verify that the modules wire up correctly
 * without requiring a running database. Run with `npm test`.
 */

describe('module loading', () => {
  test('models register all entities and associations', () => {
    process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
    process.env.DB_PORT = process.env.DB_PORT || '1';
    const models = require('../src/models');
    expect(Object.keys(models).sort()).toEqual(['Grocery', 'Order', 'OrderItem', 'User', 'sequelize'].sort());
    expect(models.User.associations.orders).toBeDefined();
    expect(models.Order.associations.user).toBeDefined();
    expect(models.Order.associations.items).toBeDefined();
    expect(models.OrderItem.associations.grocery).toBeDefined();
  });

  test('Express app boots and exposes routes', () => {
    const app = require('../src/app');
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});

describe('validators', () => {
  const orderValidator = require('../src/validators/order.validator');
  const groceryValidator = require('../src/validators/grocery.validator');

  test('order create rejects empty items', () => {
    const { error } = orderValidator.create.validate({ items: [] });
    expect(error).toBeTruthy();
  });

  test('order create rejects duplicate groceryIds', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    const { error } = orderValidator.create.validate({
      items: [
        { groceryId: id, quantity: 1 },
        { groceryId: id, quantity: 2 },
      ],
    });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/Duplicate groceryId/);
  });

  test('order create accepts valid payload', () => {
    const { error, value } = orderValidator.create.validate({
      items: [
        { groceryId: '11111111-1111-1111-1111-111111111111', quantity: 2 },
        { groceryId: '22222222-2222-2222-2222-222222222222', quantity: 5 },
      ],
    });
    expect(error).toBeUndefined();
    expect(value.items).toHaveLength(2);
  });

  test('grocery inventory operation must be valid', () => {
    const { error } = groceryValidator.updateInventory.validate({
      operation: 'multiply',
      quantity: 10,
    });
    expect(error).toBeTruthy();
  });
});

describe('utilities', () => {
  test('ApiError factories produce correct status codes', () => {
    const ApiError = require('../src/utils/apiError');
    expect(ApiError.badRequest().statusCode).toBe(400);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.conflict().statusCode).toBe(409);
    expect(ApiError.unprocessable().statusCode).toBe(422);
  });

  test('pagination clamps page/limit', () => {
    const { getPagination, buildPaginationMeta } = require('../src/utils/pagination');
    expect(getPagination({ page: 0, limit: 999 })).toEqual({ page: 1, limit: 100, offset: 0 });
    expect(getPagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, offset: 20 });
    const meta = buildPaginationMeta({ page: 2, limit: 10, total: 25 });
    expect(meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true });
  });
});
