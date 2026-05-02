'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const v = require('../validators/grocery.validator');
const ctrl = require('../controllers/grocery.controller');
const { ROLES } = require('../models/user.model');

// User-facing (authenticated) catalog
router.get('/', authenticate, validate(v.list, 'query'), asyncHandler(ctrl.userList));
router.get('/:id', authenticate, validate(v.idParam, 'params'), asyncHandler(ctrl.userGet));

// Admin management
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.create),
  asyncHandler(ctrl.adminCreate)
);

router.get(
  '/admin/all',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.list, 'query'),
  asyncHandler(ctrl.adminList)
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.idParam, 'params'),
  validate(v.update),
  asyncHandler(ctrl.adminUpdate)
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.idParam, 'params'),
  asyncHandler(ctrl.adminDelete)
);

router.patch(
  '/:id/inventory',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(v.idParam, 'params'),
  validate(v.updateInventory),
  asyncHandler(ctrl.adminUpdateInventory)
);

module.exports = router;
