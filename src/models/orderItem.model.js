'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OrderItem extends Model {}

  OrderItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
      },
      groceryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'grocery_id',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
        get() {
          const raw = this.getDataValue('unitPrice');
          return raw === null ? null : parseFloat(raw);
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const raw = this.getDataValue('subtotal');
          return raw === null ? null : parseFloat(raw);
        },
      },
      itemName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: 'item_name',
      },
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      indexes: [
        { fields: ['order_id'] },
        { fields: ['grocery_id'] },
      ],
    }
  );

  return OrderItem;
};
