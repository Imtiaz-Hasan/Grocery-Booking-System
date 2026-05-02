'use strict';

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { sequelize, connectWithRetry } = require('./config/database');
const { ensureBootstrapAdmin } = require('./scripts/bootstrap');

async function start() {
  try {
    await connectWithRetry();
    await sequelize.sync({ alter: config.env === 'development' });
    logger.info('Database synchronized');

    await ensureBootstrapAdmin();

    const server = app.listen(config.port, () => {
      logger.info(`API listening on port ${config.port} (env: ${config.env})`);
      logger.info(`Base URL: http://localhost:${config.port}${config.apiPrefix}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
