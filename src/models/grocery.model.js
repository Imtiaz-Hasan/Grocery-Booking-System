'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Grocery extends Model {}

  Grocery.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, len: [1, 150] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'piece',
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          const raw = this.getDataValue('price');
          return raw === null ? null : parseFloat(raw);
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Grocery',
      tableName: 'groceries',
      paranoid: true,
      indexes: [
        { unique: true, fields: ['name'], where: { deleted_at: null } },
        { fields: ['category'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return Grocery;
};
