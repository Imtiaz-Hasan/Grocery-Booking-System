'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const authValidator = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

router.post('/register', validate(authValidator.register), asyncHandler(ctrl.register));
router.post('/login', validate(authValidator.login), asyncHandler(ctrl.login));
router.get('/me', authenticate, asyncHandler(ctrl.me));

module.exports = router;
