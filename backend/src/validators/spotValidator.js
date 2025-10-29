const { body, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for creating a parking spot
 */
const createSpotValidator = [
  // Title validation
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  // Description validation
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),

  // Location validation
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isObject()
    .withMessage('Location must be an object'),

  body('location.lat')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),

  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),

  body('location.pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid 6-digit pincode'),

  // Photos validation
  body('photos')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 and maximum 10 photos are required'),

  // Type validation
  body('type')
    .notEmpty()
    .withMessage('Parking type is required')
    .isIn(['open', 'covered', 'garage', 'street', 'driveway'])
    .withMessage('Type must be one of: open, covered, garage, street, driveway'),

  // Amenities validation
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .isIn(['cctv', 'security', 'lighting', 'ev-charging', 'covered', 'washroom', 'disabled-access', '24x7', 'valet'])
    .withMessage('Invalid amenity type'),

  // Price validation
  body('pricePerHour')
    .notEmpty()
    .withMessage('Price per hour is required')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price per hour must be between 0 and 10000'),

  body('pricePerDay')
    .notEmpty()
    .withMessage('Price per day is required')
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Price per day must be between 0 and 50000'),

  // Capacity validation
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),

  // Vehicle types validation
  body('vehicleTypes')
    .notEmpty()
    .withMessage('At least one vehicle type is required')
    .isArray({ min: 1 })
    .withMessage('Vehicle types must be an array with at least one type'),

  body('vehicleTypes.*')
    .isIn(['car', 'bike', 'bicycle', 'suv', 'truck'])
    .withMessage('Invalid vehicle type'),

  // Availability validation
  body('availability')
    .notEmpty()
    .withMessage('Availability is required')
    .isArray({ min: 1 })
    .withMessage('At least one availability slot is required'),

  body('availability.*.day')
    .notEmpty()
    .withMessage('Day is required for availability slot')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day name'),

  body('availability.*.startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),

  body('availability.*.endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),

  // Status validation (optional for creation)
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be one of: active, inactive, pending'),

  validate
];

/**
 * Validation rules for updating a parking spot
 */
const updateSpotValidator = [
  // Title validation (optional for update)
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  // Description validation (optional)
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),

  // Location validation (optional)
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),

  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),

  body('location.pincode')
    .optional()
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid 6-digit pincode'),

  // Type validation (optional)
  body('type')
    .optional()
    .isIn(['open', 'covered', 'garage', 'street', 'driveway'])
    .withMessage('Type must be one of: open, covered, garage, street, driveway'),

  // Amenities validation (optional)
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .isIn(['cctv', 'security', 'lighting', 'ev-charging', 'covered', 'washroom', 'disabled-access', '24x7', 'valet'])
    .withMessage('Invalid amenity type'),

  // Price validation (optional)
  body('pricePerHour')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price per hour must be between 0 and 10000'),

  body('pricePerDay')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Price per day must be between 0 and 50000'),

  // Capacity validation (optional)
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),

  // Vehicle types validation (optional)
  body('vehicleTypes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Vehicle types must be an array with at least one type'),

  body('vehicleTypes.*')
    .optional()
    .isIn(['car', 'bike', 'bicycle', 'suv', 'truck'])
    .withMessage('Invalid vehicle type'),

  // Availability validation (optional)
  body('availability')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one availability slot is required'),

  body('availability.*.day')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day name'),

  body('availability.*.startTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),

  body('availability.*.endTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),

  // Status validation (optional)
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be one of: active, inactive, pending'),

  // Prevent updating restricted fields
  body('hostId')
    .not()
    .exists()
    .withMessage('Cannot update hostId'),

  body('rating')
    .not()
    .exists()
    .withMessage('Cannot update rating directly'),

  body('totalReviews')
    .not()
    .exists()
    .withMessage('Cannot update totalReviews directly'),

  body('totalBookings')
    .not()
    .exists()
    .withMessage('Cannot update totalBookings directly'),

  validate
];

/**
 * Validation rules for search query parameters
 */
const searchQueryValidator = [
  // Location parameters
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),

  query('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City name must be between 2 and 50 characters'),

  query('pincode')
    .optional()
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format'),

  // Price parameters
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),

  query('priceType')
    .optional()
    .isIn(['hourly', 'daily'])
    .withMessage('Price type must be either hourly or daily'),

  // Type parameter
  query('type')
    .optional()
    .isIn(['open', 'covered', 'garage', 'street', 'driveway'])
    .withMessage('Invalid parking type'),

  // Vehicle type parameter
  query('vehicleType')
    .optional()
    .isIn(['car', 'bike', 'bicycle', 'suv', 'truck'])
    .withMessage('Invalid vehicle type'),

  // Rating parameter
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),

  // Capacity parameter
  query('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  // Verified parameter
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),

  // Sorting parameters
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'distance', 'newest', 'popular', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),

  // Pagination parameters
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Status parameter
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Invalid status'),

  // Search text
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),

  validate
];

/**
 * Validation rules for availability update
 */
const availabilityValidator = [
  body('availability')
    .notEmpty()
    .withMessage('Availability is required')
    .isArray({ min: 1 })
    .withMessage('Availability must be an array with at least one slot'),

  body('availability.*.day')
    .notEmpty()
    .withMessage('Day is required for each availability slot')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day name'),

  body('availability.*.startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),

  body('availability.*.endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),

  // Custom validation to check start time < end time
  body('availability.*.startTime').custom((startTime, { req, path }) => {
    // Extract the index from the path (e.g., "availability[0].startTime" -> 0)
    const match = path.match(/\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1]);
      const endTime = req.body.availability[index]?.endTime;
      
      if (endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) {
          throw new Error('Start time must be before end time');
        }
      }
    }
    return true;
  }),

  validate
];

/**
 * Validation rules for status update
 */
const statusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be one of: active, inactive, pending'),

  validate
];

module.exports = {
  createSpotValidator,
  updateSpotValidator,
  searchQueryValidator,
  availabilityValidator,
  statusValidator
};
