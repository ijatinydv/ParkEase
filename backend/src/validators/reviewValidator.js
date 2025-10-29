const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a review
 */
const createReviewValidation = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid booking ID format'),

  body('revieweeId')
    .notEmpty()
    .withMessage('Reviewee ID is required')
    .isMongoId()
    .withMessage('Invalid reviewee ID format'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),

  body('type')
    .notEmpty()
    .withMessage('Review type is required')
    .isIn(['host-review', 'seeker-review', 'spot-review'])
    .withMessage('Type must be either host-review, seeker-review, or spot-review'),

  // Optional detailed ratings
  body('cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness rating must be between 1 and 5'),

  body('accessibility')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Accessibility rating must be between 1 and 5'),

  body('security')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Security rating must be between 1 and 5'),

  body('valueForMoney')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Value for money rating must be between 1 and 5'),

  body('photos')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 photos allowed'),

  body('photos.*')
    .optional()
    .isURL()
    .withMessage('Each photo must be a valid URL')
];

/**
 * Validation rules for updating a review
 */
const updateReviewValidation = [
  param('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID format'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),

  body('cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness rating must be between 1 and 5'),

  body('accessibility')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Accessibility rating must be between 1 and 5'),

  body('security')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Security rating must be between 1 and 5'),

  body('valueForMoney')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Value for money rating must be between 1 and 5'),

  body('photos')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 photos allowed'),

  body('photos.*')
    .optional()
    .isURL()
    .withMessage('Each photo must be a valid URL')
];

/**
 * Validation rules for getting spot reviews
 */
const getSpotReviewsValidation = [
  param('spotId')
    .notEmpty()
    .withMessage('Spot ID is required')
    .isMongoId()
    .withMessage('Invalid spot ID format'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['rating', 'date', 'helpful'])
    .withMessage('Sort must be one of: rating, date, helpful')
];

/**
 * Validation rules for getting user reviews
 */
const getUserReviewsValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  query('type')
    .optional()
    .isIn(['host-review', 'seeker-review', 'all'])
    .withMessage('Type must be one of: host-review, seeker-review, all'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation rules for review ID parameter
 */
const reviewIdValidation = [
  param('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID format')
];

/**
 * Validation rules for adding a response to a review
 */
const addResponseValidation = [
  param('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID format'),

  body('response')
    .notEmpty()
    .withMessage('Response is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Response must be between 10 and 500 characters')
];

/**
 * Validation rules for marking review as helpful
 */
const markHelpfulValidation = [
  param('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID format')
];

/**
 * Validation rules for flagging a review
 */
const flagReviewValidation = [
  param('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID format'),

  body('reason')
    .notEmpty()
    .withMessage('Flag reason is required')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Flag reason must be between 10 and 200 characters')
];

module.exports = {
  createReviewValidation,
  updateReviewValidation,
  getSpotReviewsValidation,
  getUserReviewsValidation,
  reviewIdValidation,
  addResponseValidation,
  markHelpfulValidation,
  flagReviewValidation
};
