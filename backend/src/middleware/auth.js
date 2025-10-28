const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Middleware - Verify JWT Token and Authenticate User
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token signature and expiry
 * 3. Fetches user from database
 * 4. Checks if user is active
 * 5. Attaches user object to req.user for use in controllers
 * 
 * @usage Apply to protected routes that require authentication
 * @example router.get('/profile', protect, getUserProfile)
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Extract token from Authorization header
    // Expected format: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Split "Bearer <token>" and get the token part
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    // 3. Verify token
    // This will throw an error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Check token type (should be 'access' token, not 'reset' token)
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Please use access token.'
      });
    }

    // 5. Get user from database using ID from token payload
    // Exclude password field from the result
    const user = await User.findById(decoded.id).select('-password');

    // 6. Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    // 7. Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 8. Attach user to request object for use in next middleware/controller
    req.user = user;

    // 9. Continue to next middleware or controller
    next();

  } catch (error) {
    // Handle specific JWT errors with appropriate messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    // Generic error for unexpected issues
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route.'
    });
  }
};

/**
 * Authorize Middleware - Check User Roles
 * 
 * This middleware checks if the authenticated user has one of the required roles.
 * Must be used AFTER the protect middleware.
 * 
 * @param {...string} roles - Allowed roles (e.g., 'host', 'seeker', 'both')
 * @returns {Function} Express middleware function
 * 
 * @usage Apply to routes that require specific roles
 * @example router.post('/spots', protect, authorize('host', 'both'), createSpot)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Check if user exists on request (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // 2. Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`,
        requiredRoles: roles
      });
    }

    // 3. User has required role, continue to next middleware/controller
    next();
  };
};

/**
 * Authorize Owner Middleware - Check Resource Ownership
 * 
 * This middleware checks if the authenticated user owns a specific resource.
 * Must be used AFTER the protect middleware.
 * 
 * @param {Model} Model - Mongoose model to check ownership against
 * @param {string} resourceIdParam - Request parameter name for resource ID (default: 'id')
 * @param {string} ownerField - Field name in the model that contains owner ID (default: 'owner')
 * @returns {Function} Express middleware function
 * 
 * @usage Apply to routes that require resource ownership
 * @example router.put('/spots/:id', protect, authorizeOwner(ParkingSpot), updateSpot)
 */
const authorizeOwner = (Model, resourceIdParam = 'id', ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      // 1. Get resource ID from request parameters
      const resourceId = req.params[resourceIdParam];

      // 2. Find the resource in database
      const resource = await Model.findById(resourceId);

      // 3. Check if resource exists
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} not found`
        });
      }

      // 4. Check if current user is the owner
      // Convert both to string for comparison (MongoDB ObjectId vs string)
      if (resource[ownerField].toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource. You are not the owner.'
        });
      }

      // 5. Attach resource to request for use in controller (optional optimization)
      // This prevents the controller from fetching the resource again
      req.resource = resource;

      // 6. User is the owner, continue to next middleware/controller
      next();

    } catch (error) {
      console.error('Authorize Owner Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  authorizeOwner
};
