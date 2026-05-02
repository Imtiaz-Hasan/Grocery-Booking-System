'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const v = require('../validators/order.validator');
const ctrl = require('../controllers/order.controller');
const { ROLES } = require('../models/user.model');

// User
router.post('/', authenticate, validate(v.create), asyncHandler(ctrl.createOrder));
router.get('/', authenticate, validate(v.list, 'query'), asyncHandler(ctrl.listMyOrders));
router.get('/:id', authenticate, validate(v.idParam, 'params'), asyncHandler(ctrl.getMyOrder));

// Admin
router.get(
  '/admin/all',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.list, 'query'),
  asyncHandler(ctrl.adminListOrders)
);

router.get(
  '/admin/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.idParam, 'params'),
  asyncHandler(ctrl.adminGetOrder)
);

module.exports = router;
