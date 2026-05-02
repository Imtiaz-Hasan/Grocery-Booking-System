'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const config = require('../config');

const ROLES = Object.freeze({ ADMIN: 'admin', USER: 'user' });

module.exports = (sequelize) => {
  class User extends Model {
    async comparePassword(plain) {
      return bcrypt.compare(plain, this.password);
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 120] },
      },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
        set(value) {
          this.setDataValue('email', String(value).toLowerCase().trim());
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(ROLES.ADMIN, ROLES.USER),
        allowNull: false,
        defaultValue: ROLES.USER,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      indexes: [{ unique: true, fields: ['email'] }],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, config.bcrypt.saltRounds);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, config.bcrypt.saltRounds);
          }
        },
      },
    }
  );

  User.ROLES = ROLES;

  return User;
};

module.exports.ROLES = ROLES;
