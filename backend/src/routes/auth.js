const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
  updatePassword
} = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');

// Import validators
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updatePasswordValidation
} = require('../validators/authValidator');

// Import rate limiters
const rateLimit = require('express-rate-limit');

/**
 * Rate Limiters for Authentication Endpoints
 * Protect against brute force attacks and spam
 */

// Strict rate limiter for login (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// Moderate rate limiter for registration (3 registrations per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Conservative rate limiter for password reset (3 requests per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Public Routes (No Authentication Required)
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// @rateLimit 3 requests per hour
router.post(
  '/register',
  registerLimiter,
  registerValidation,
  register
);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
// @rateLimit 5 attempts per 15 minutes
router.post(
  '/login',
  loginLimiter,
  loginValidation,
  login
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset token to email
// @access  Public
// @rateLimit 3 requests per hour
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post(
  '/reset-password',
  resetPasswordValidation,
  resetPassword
);

/**
 * Protected Routes (Authentication Required)
 * All routes below require valid JWT token
 */

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get(
  '/me',
  protect,
  getMe
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post(
  '/logout',
  protect,
  logout
);

// @route   PUT /api/auth/update-password
// @desc    Update password for logged in user
// @access  Private
router.put(
  '/update-password',
  protect,
  updatePasswordValidation,
  updatePassword
);

module.exports = router;
