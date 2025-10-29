const express = require('express');
const router = express.Router();

// Import controllers
const {
  createSpot,
  getAllSpots,
  getNearbySpots,
  getSpotById,
  updateSpot,
  deleteSpot,
  uploadPhotos,
  deletePhoto,
  updateAvailability,
  updateStatus,
  getMySpots
} = require('../controllers/spotController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Import validators
const {
  createSpotValidator,
  updateSpotValidator,
  searchQueryValidator,
  availabilityValidator,
  statusValidator
} = require('../validators/spotValidator');

/**
 * Public Routes - No authentication required
 */

// @route   GET /api/spots
// @desc    Get all parking spots with filters and search
// @access  Public
router.get('/', searchQueryValidator, getAllSpots);

// @route   GET /api/spots/nearby
// @desc    Get nearby parking spots using geolocation
// @access  Public
// NOTE: This must come BEFORE /:id route to avoid treating 'nearby' as an ID
router.get('/nearby', getNearbySpots);

// @route   GET /api/spots/:id
// @desc    Get single parking spot by ID
// @access  Public
router.get('/:id', getSpotById);

/**
 * Protected Routes - Authentication required
 */

// @route   GET /api/spots/my-spots
// @desc    Get host's own parking spots
// @access  Private (Host/Both)
router.get('/host/my-spots', protect, authorize('host', 'both'), getMySpots);

// @route   POST /api/spots
// @desc    Create a new parking spot
// @access  Private (Host/Both only)
router.post(
  '/',
  protect,
  authorize('host', 'both'),
  createSpotValidator,
  createSpot
);

// @route   PUT /api/spots/:id
// @desc    Update parking spot (full update)
// @access  Private (Owner only)
router.put(
  '/:id',
  protect,
  authorize('host', 'both'),
  updateSpotValidator,
  updateSpot
);

// @route   DELETE /api/spots/:id
// @desc    Delete parking spot (soft/hard delete)
// @access  Private (Owner only)
router.delete(
  '/:id',
  protect,
  authorize('host', 'both'),
  deleteSpot
);

// @route   POST /api/spots/:id/photos
// @desc    Upload photos to parking spot
// @access  Private (Owner only)
router.post(
  '/:id/photos',
  protect,
  authorize('host', 'both'),
  upload.array('photos', 10), // Max 10 photos
  uploadPhotos
);

// @route   DELETE /api/spots/:id/photos/:photoIndex
// @desc    Delete a specific photo from parking spot
// @access  Private (Owner only)
router.delete(
  '/:id/photos/:photoIndex',
  protect,
  authorize('host', 'both'),
  deletePhoto
);

// @route   PATCH /api/spots/:id/availability
// @desc    Update parking spot availability
// @access  Private (Owner only)
router.patch(
  '/:id/availability',
  protect,
  authorize('host', 'both'),
  availabilityValidator,
  updateAvailability
);

// @route   PATCH /api/spots/:id/status
// @desc    Update parking spot status (active/inactive/pending)
// @access  Private (Owner only)
router.patch(
  '/:id/status',
  protect,
  authorize('host', 'both'),
  statusValidator,
  updateStatus
);

module.exports = router;
