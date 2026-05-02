'use strict';

const { User } = require('../models');
const ApiError = require('../utils/apiError');
const { ok, created } = require('../utils/apiResponse');
const { signAccessToken } = require('../services/token.service');

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email is already registered');

  const user = await User.create({ name, email, password, role: User.ROLES.USER });
  const token = signAccessToken({ sub: user.id, role: user.role });

  return created(res, 'Registration successful', { user, token });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid credentials');

  const token = signAccessToken({ sub: user.id, role: user.role });
  return ok(res, 'Login successful', { user, token });
}

async function me(req, res) {
  return ok(res, 'Current user', { user: req.user });
}

module.exports = { register, login, me };
