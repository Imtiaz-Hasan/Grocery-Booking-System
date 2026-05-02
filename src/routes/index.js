'use strict';

const router = require('express').Router();
const authRoutes = require('./auth.routes');
const groceryRoutes = require('./grocery.routes');
const orderRoutes = require('./order.routes');

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/groceries', groceryRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
