'use strict';

require('dotenv').config();

const { sequelize, Grocery, User } = require('../models');
const { ensureBootstrapAdmin } = require('./bootstrap');
const logger = require('../utils/logger');
const { connectWithRetry } = require('../config/database');

const SAMPLE_GROCERIES = [
  { name: 'Apple (Fuji)', category: 'Fruits', unit: 'kg', price: 3.49, stock: 120, description: 'Crisp and sweet Fuji apples.' },
  { name: 'Banana', category: 'Fruits', unit: 'kg', price: 1.29, stock: 200, description: 'Ripe yellow bananas.' },
  { name: 'Whole Milk 1L', category: 'Dairy', unit: 'liter', price: 1.99, stock: 80, description: 'Fresh whole milk.' },
  { name: 'Cheddar Cheese', category: 'Dairy', unit: 'kg', price: 12.5, stock: 30, description: 'Aged cheddar.' },
  { name: 'Chicken Breast', category: 'Meat', unit: 'kg', price: 8.99, stock: 45, description: 'Boneless skinless.' },
  { name: 'Brown Bread', category: 'Bakery', unit: 'piece', price: 2.5, stock: 60, description: 'Whole wheat loaf.' },
  { name: 'Rice (Basmati)', category: 'Grains', unit: 'kg', price: 4.25, stock: 150, description: 'Premium basmati.' },
  { name: 'Olive Oil 500ml', category: 'Pantry', unit: 'piece', price: 9.75, stock: 40, description: 'Extra virgin.' },
  { name: 'Eggs (Dozen)', category: 'Dairy', unit: 'piece', price: 4.0, stock: 100, description: 'Free-range, large.' },
  { name: 'Tomato', category: 'Vegetables', unit: 'kg', price: 2.1, stock: 90, description: 'Vine-ripened.' },
];

async function run() {
  try {
    await connectWithRetry();
    await sequelize.sync();

    await ensureBootstrapAdmin();

    let created = 0;
    let skipped = 0;
    for (const item of SAMPLE_GROCERIES) {
      const [, wasCreated] = await Grocery.findOrCreate({
        where: { name: item.name },
        defaults: item,
      });
      if (wasCreated) created++;
      else skipped++;
    }

    logger.info(`Seed complete. Created: ${created}, skipped (existing): ${skipped}`);
    const totalUsers = await User.count();
    const totalItems = await Grocery.count();
    logger.info(`Totals — users: ${totalUsers}, groceries: ${totalItems}`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
