'use strict';

const { User } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');

async function ensureBootstrapAdmin() {
  const email = config.bootstrap.adminEmail;
  const existing = await User.findOne({ where: { email } });

  if (existing) {
    if (existing.role !== User.ROLES.ADMIN) {
      logger.warn(`Bootstrap email ${email} exists but is not admin. Skipping.`);
    }
    return existing;
  }

  const admin = await User.create({
    name: config.bootstrap.adminName,
    email,
    password: config.bootstrap.adminPassword,
    role: User.ROLES.ADMIN,
  });

  logger.info(`Bootstrap admin created: ${admin.email}`);
  return admin;
}

module.exports = { ensureBootstrapAdmin };
