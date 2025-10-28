const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @param {string} type - Token type ('access' or 'reset')
 * @returns {string} JWT token
 */
const generateToken = (id, email, role, type = 'access') => {
  // Prepare payload based on token type
  const payload = {
    id,
    email,
    type
  };

  // Add role only for access tokens
  if (type === 'access') {
    payload.role = role;
  }

  // Determine expiry time based on token type
  const expiresIn = type === 'reset' 
    ? process.env.JWT_RESET_EXPIRE || '15m'  // Short expiry for reset tokens
    : process.env.JWT_EXPIRE || '24h';        // Longer expiry for access tokens

  // Sign and return token
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn }
  );

  return token;
};

/**
 * Generate Access Token (for authentication)
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  return generateToken(user._id || user.id, user.email, user.role, 'access');
};

/**
 * Generate Reset Token (for password reset)
 * @param {Object} user - User object
 * @returns {string} JWT reset token
 */
const generateResetToken = (user) => {
  return generateToken(user._id || user.id, user.email, user.role, 'reset');
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateResetToken
};
