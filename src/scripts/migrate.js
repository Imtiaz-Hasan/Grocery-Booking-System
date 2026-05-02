'use strict';

require('dotenv').config();

const { sequelize } = require('../models');
const logger = require('../utils/logger');
const { connectWithRetry } = require('../config/database');

async function run() {
  const force = process.argv.includes('--force');
  const alter = process.argv.includes('--alter');

  try {
    await connectWithRetry();
    await sequelize.sync({ force, alter });
    logger.info(`Migration complete (force=${force}, alter=${alter})`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
