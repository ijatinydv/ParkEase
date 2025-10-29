const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getSpotReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewById,
  addResponse,
  markHelpful,
  flagReview
} = require('../controllers/reviewController');
const {
  createReviewValidation,
  updateReviewValidation,
  getSpotReviewsValidation,
  getUserReviewsValidation,
  reviewIdValidation,
  addResponseValidation,
  markHelpfulValidation,
  flagReviewValidation
} = require('../validators/reviewValidator');

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', protect, createReviewValidation, createReview);

/**
 * @route   GET /api/reviews/spot/:spotId
 * @desc    Get all reviews for a parking spot
 * @access  Public
 */
router.get('/spot/:spotId', getSpotReviewsValidation, getSpotReviews);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews received by a user
 * @access  Public
 */
router.get('/user/:userId', getUserReviewsValidation, getUserReviews);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get('/:reviewId', reviewIdValidation, getReviewById);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review (within 24 hours)
 * @access  Private
 */
router.put('/:reviewId', protect, updateReviewValidation, updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review (Admin only)
 * @access  Private/Admin
 * @note    This should be enhanced with admin middleware
 */
router.delete('/:reviewId', protect, reviewIdValidation, deleteReview);

/**
 * @route   POST /api/reviews/:reviewId/response
 * @desc    Add response to a review (reviewee only)
 * @access  Private
 */
router.post('/:reviewId/response', protect, addResponseValidation, addResponse);

/**
 * @route   POST /api/reviews/:reviewId/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.post('/:reviewId/helpful', protect, markHelpfulValidation, markHelpful);

/**
 * @route   POST /api/reviews/:reviewId/flag
 * @desc    Flag a review for inappropriate content
 * @access  Private
 */
router.post('/:reviewId/flag', protect, flagReviewValidation, flagReview);

module.exports = router;
