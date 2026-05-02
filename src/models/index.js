'use strict';

const { sequelize } = require('../config/database');
const UserModel = require('./user.model');
const GroceryModel = require('./grocery.model');
const OrderModel = require('./order.model');
const OrderItemModel = require('./orderItem.model');

const User = UserModel(sequelize);
const Grocery = GroceryModel(sequelize);
const Order = OrderModel(sequelize);
const OrderItem = OrderItemModel(sequelize);

User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Grocery.hasMany(OrderItem, { foreignKey: 'groceryId', as: 'orderItems' });
OrderItem.belongsTo(Grocery, { foreignKey: 'groceryId', as: 'grocery' });

module.exports = {
  sequelize,
  User,
  Grocery,
  Order,
  OrderItem,
};
