'use strict';

require('dotenv').config();

const env = process.env;

const config = {
  env: env.NODE_ENV || 'development',
  port: parseInt(env.PORT, 10) || 3000,
  apiPrefix: env.API_PREFIX || '/api/v1',

  db: {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT, 10) || 5432,
    name: env.DB_NAME || 'grocery_booking',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    dialect: env.DB_DIALECT || 'postgres',
    logging: env.DB_LOGGING === 'true',
  },

  jwt: {
    secret: env.JWT_SECRET || 'change_me_in_production',
    expiresIn: env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    saltRounds: parseInt(env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  bootstrap: {
    adminEmail: env.ADMIN_EMAIL || 'admin@grocery.local',
    adminPassword: env.ADMIN_PASSWORD || 'Admin@12345',
    adminName: env.ADMIN_NAME || 'Default Admin',
  },
};

if (config.env === 'production' && config.jwt.secret === 'change_me_in_production') {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}

module.exports = config;
