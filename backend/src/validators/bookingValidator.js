const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for creating a booking
 */
const validateCreateBooking = [
  body('spotId')
    .notEmpty()
    .withMessage('Spot ID is required')
    .isMongoId()
    .withMessage('Invalid spot ID format'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const endTime = new Date(value);
      const startTime = new Date(req.body.startTime);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      
      // Check if duration is reasonable (max 30 days)
      const durationDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
      if (durationDays > 30) {
        throw new Error('Booking duration cannot exceed 30 days');
      }
      
      // Minimum duration (1 hour)
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      if (durationHours < 1) {
        throw new Error('Booking duration must be at least 1 hour');
      }
      
      return true;
    }),

  body('vehicleNumber')
    .notEmpty()
    .withMessage('Vehicle number is required')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage(
      'Invalid vehicle number format. Expected format: MH12AB1234'
    ),

  body('vehicleType')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isIn(['car', 'bike', 'bicycle', 'suv', 'truck'])
    .withMessage('Invalid vehicle type'),

  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for check-in
 */
const validateCheckIn = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),

  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for check-out
 */
const validateCheckOut = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),

  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for cancel booking
 */
const validateCancelBooking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),

  body('reasonCode')
    .optional()
    .isIn([
      'user_request',
      'change_of_plans',
      'emergency',
      'spot_issue',
      'other'
    ])
    .withMessage('Invalid reason code'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for get bookings (query params)
 */
const validateGetBookings = [
  query('role')
    .optional()
    .isIn(['seeker', 'host'])
    .withMessage('Role must be either seeker or host'),

  query('status')
    .optional()
    .isIn([
      'pending',
      'confirmed',
      'checkedIn',
      'checkedOut',
      'cancelled',
      'disputed',
      'completed'
    ])
    .withMessage('Invalid status value'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'startTime', 'endTime', 'totalAmount'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for get booking by ID
 */
const validateGetBookingById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for raise dispute
 */
const validateRaiseDispute = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  body('reason')
    .notEmpty()
    .withMessage('Dispute reason is required')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Dispute reason must be between 10 and 1000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Dispute category is required')
    .isIn([
      'spot_not_available',
      'spot_mismatch',
      'damage_claim',
      'incorrect_charge',
      'safety_concern',
      'no_show_seeker',
      'early_departure',
      'other'
    ])
    .withMessage('Invalid dispute category'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateCreateBooking,
  validateCheckIn,
  validateCheckOut,
  validateCancelBooking,
  validateGetBookings,
  validateGetBookingById,
  validateRaiseDispute
};
