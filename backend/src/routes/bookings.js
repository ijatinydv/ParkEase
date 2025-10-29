const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  checkIn,
  checkOut,
  cancelBooking,
  raiseDispute
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  validateCreateBooking,
  validateCheckIn,
  validateCheckOut,
  validateCancelBooking,
  validateGetBookings,
  validateGetBookingById,
  validateRaiseDispute
} = require('../validators/bookingValidator');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Authenticated users)
 */
router.post('/', protect, validateCreateBooking, createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings (filtered by role: seeker or host)
 * @access  Private
 * @query   role - 'seeker' or 'host' (default: seeker)
 * @query   status - Filter by booking status
 * @query   page - Page number for pagination (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   sortBy - Field to sort by (default: createdAt)
 * @query   sortOrder - 'asc' or 'desc' (default: desc)
 * @query   startDate - Filter bookings from this date
 * @query   endDate - Filter bookings until this date
 */
router.get('/', protect, validateGetBookings, getUserBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking details
 * @access  Private (Seeker or Host only)
 */
router.get('/:id', protect, validateGetBookingById, getBookingById);

/**
 * @route   PATCH /api/bookings/:id/checkin
 * @desc    Check-in to a booking
 * @access  Private (Seeker only)
 * @notes   Requires photos (1-5 images)
 *          Optional: location (GPS coordinates), notes
 */
router.patch(
  '/:id/checkin',
  protect,
  upload.array('photos', 5), // Max 5 photos
  validateCheckIn,
  checkIn
);

/**
 * @route   PATCH /api/bookings/:id/checkout
 * @desc    Check-out from a booking
 * @access  Private (Seeker only)
 * @notes   Requires photos (1-5 images)
 *          Optional: location (GPS coordinates), notes
 *          Automatically calculates overtime charges if applicable
 */
router.patch(
  '/:id/checkout',
  protect,
  upload.array('photos', 5), // Max 5 photos
  validateCheckOut,
  checkOut
);

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (Seeker or Host)
 * @notes   Refund amount depends on cancellation timing:
 *          - >24 hours: 100% refund
 *          - 12-24 hours: 75% refund
 *          - 2-12 hours: 50% refund
 *          - <2 hours: No refund
 */
router.patch('/:id/cancel', protect, validateCancelBooking, cancelBooking);

/**
 * @route   POST /api/bookings/:id/dispute
 * @desc    Raise a dispute for a booking
 * @access  Private (Seeker or Host)
 * @notes   Can upload evidence photos (up to 10 images)
 *          Dispute categories:
 *          - spot_not_available
 *          - spot_mismatch
 *          - damage_claim
 *          - incorrect_charge
 *          - safety_concern
 *          - no_show_seeker
 *          - early_departure
 *          - other
 */
router.post(
  '/:id/dispute',
  protect,
  upload.array('evidence', 10), // Max 10 evidence photos
  validateRaiseDispute,
  raiseDispute
);

module.exports = router;
