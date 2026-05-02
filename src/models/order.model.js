'use strict';

const { DataTypes, Model } = require('sequelize');

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

module.exports = (sequelize) => {
  class Order extends Model {}

  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
        get() {
          const raw = this.getDataValue('totalAmount');
          return raw === null ? null : parseFloat(raw);
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
        allowNull: false,
        defaultValue: ORDER_STATUS.CONFIRMED,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  Order.STATUS = ORDER_STATUS;
  return Order;
};

module.exports.ORDER_STATUS = ORDER_STATUS;
