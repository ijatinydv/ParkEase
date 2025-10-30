const express = require('express');
const router = express.Router();
const {
  verifyCheckInPhoto,
  verifyCheckOutPhoto,
  getVerificationStatus
} = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/bookings/:id/verify-checkin
 * @desc    Verify check-in photo with AI
 * @access  Private (Seeker only)
 */
router.post(
  '/:id/verify-checkin',
  protect,
  upload.single('photo'),
  verifyCheckInPhoto
);

/**
 * @route   POST /api/bookings/:id/verify-checkout
 * @desc    Verify check-out photo with AI
 * @access  Private (Seeker only)
 */
router.post(
  '/:id/verify-checkout',
  protect,
  upload.single('photo'),
  verifyCheckOutPhoto
);

/**
 * @route   GET /api/bookings/:id/verification-status
 * @desc    Get verification status for a booking
 * @access  Private
 */
router.get(
  '/:id/verification-status',
  protect,
  getVerificationStatus
);

module.exports = router;
