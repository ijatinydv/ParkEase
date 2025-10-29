const ParkingSpot = require('../models/ParkingSpot');
const Booking = require('../models/Booking');
const { cloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new parking spot
 * @route   POST /api/spots
 * @access  Private (Host only)
 */
const createSpot = async (req, res) => {
  try {
    // 1. Verify user has host role
    if (req.user.role !== 'host' && req.user.role !== 'both') {
      return res.status(403).json({
        success: false,
        message: 'Only hosts can create parking spots. Please update your role to host.'
      });
    }

    // 2. Extract spot data from request body
    const spotData = {
      ...req.body,
      hostId: req.user._id // Automatically set from authenticated user
    };

    // 3. Validate that coordinates match location if provided
    if (spotData.location && spotData.location.lat && spotData.location.lng) {
      // Coordinates will be auto-synced by pre-save middleware in model
      spotData.coordinates = {
        type: 'Point',
        coordinates: [spotData.location.lng, spotData.location.lat]
      };
    }

    // 4. Create parking spot
    const spot = await ParkingSpot.create(spotData);

    // 5. Populate host details before returning
    await spot.populate({
      path: 'hostId',
      select: 'name email phone profilePhoto trustScore aadharVerified'
    });

    // 6. Return success response
    res.status(201).json({
      success: true,
      message: 'Parking spot created successfully',
      data: spot
    });

  } catch (error) {
    console.error('Create Spot Error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A spot with similar details already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create parking spot',
      error: error.message
    });
  }
};

/**
 * @desc    Get all parking spots with filters, pagination, and sorting
 * @route   GET /api/spots
 * @access  Public
 */
const getAllSpots = async (req, res) => {
  try {
    // 1. Extract query parameters
    const {
      // Location filters
      city,
      pincode,
      lat,
      lng,
      radius,
      
      // Price filters
      minPrice,
      maxPrice,
      priceType = 'hourly',
      
      // Type and amenities
      type,
      amenities,
      vehicleType,
      
      // Availability
      startDate,
      endDate,
      
      // Quality filters
      minRating,
      verified,
      
      // Capacity
      capacity,
      
      // Status
      status = 'active',
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'desc',
      
      // Pagination
      page = 1,
      limit = 20,
      
      // Text search
      search
    } = req.query;

    // 2. Build base query
    const query = {
      isActive: true
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // 3. Apply location filters
    if (city) {
      query['location.city'] = new RegExp(city, 'i'); // Case-insensitive
    }

    if (pincode) {
      query['location.pincode'] = pincode;
    }

    // 4. Apply price filters
    const priceField = priceType === 'daily' ? 'pricePerDay' : 'pricePerHour';
    
    if (minPrice || maxPrice) {
      query[priceField] = {};
      if (minPrice) query[priceField].$gte = Number(minPrice);
      if (maxPrice) query[priceField].$lte = Number(maxPrice);
    }

    // 5. Apply type filter
    if (type) {
      query.type = type;
    }

    // 6. Apply amenities filter (spot must have ALL requested amenities)
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) 
        ? amenities 
        : amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenitiesArray };
    }

    // 7. Apply vehicle type filter
    if (vehicleType) {
      query.vehicleTypes = vehicleType;
    }

    // 8. Apply rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // 9. Apply capacity filter
    if (capacity) {
      query.capacity = { $gte: Number(capacity) };
    }

    // 10. Apply verified host filter
    if (verified === 'true') {
      // Will need to use aggregation to filter by host.aadharVerified
      // For now, this is a simple placeholder
      query.aadharVerified = true;
    }

    // 11. Apply text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // 12. Build sort criteria
    let sortCriteria = {};
    
    switch (sortBy) {
      case 'price':
        sortCriteria[priceField] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'rating':
        sortCriteria = { rating: -1, totalReviews: -1 };
        break;
      case 'popular':
        sortCriteria = { totalBookings: -1, rating: -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'distance':
        // Distance sorting requires geospatial query (handled separately)
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    // 13. Handle geolocation-based queries (if lat/lng provided)
    let spots;
    let totalResults;

    if (lat && lng && sortBy === 'distance') {
      // Use aggregation with $geoNear for distance-based sorting
      const aggregationPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)]
            },
            distanceField: 'distance',
            maxDistance: radius ? Number(radius) * 1000 : 50000, // Convert km to meters
            spherical: true,
            query: query
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'hostId',
            foreignField: '_id',
            as: 'host'
          }
        },
        {
          $unwind: '$host'
        },
        {
          $project: {
            'host.password': 0,
            'host.phone': 0,
            'host.__v': 0,
            '__v': 0
          }
        },
        {
          $sort: { distance: 1 }
        }
      ];

      // Get total count
      const countPipeline = [...aggregationPipeline, { $count: 'total' }];
      const countResult = await ParkingSpot.aggregate(countPipeline);
      totalResults = countResult.length > 0 ? countResult[0].total : 0;

      // Apply pagination
      aggregationPipeline.push(
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) }
      );

      spots = await ParkingSpot.aggregate(aggregationPipeline);

    } else {
      // Regular query without geolocation
      const skip = (Number(page) - 1) * Number(limit);

      // Get total count for pagination
      totalResults = await ParkingSpot.countDocuments(query);

      // Execute query with pagination and sorting
      spots = await ParkingSpot.find(query)
        .populate({
          path: 'hostId',
          select: 'name profilePhoto trustScore aadharVerified'
        })
        .sort(sortCriteria)
        .skip(skip)
        .limit(Number(limit))
        .lean(); // Use lean for better performance (read-only)
    }

    // 14. Calculate pagination metadata
    const totalPages = Math.ceil(totalResults / Number(limit));
    const currentPage = Number(page);

    // 15. Return response
    res.status(200).json({
      success: true,
      count: spots.length,
      pagination: {
        currentPage,
        totalPages,
        limit: Number(limit),
        totalResults,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      },
      filters: {
        applied: {
          ...(city && { city }),
          ...(pincode && { pincode }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(type && { type }),
          ...(amenities && { amenities }),
          ...(sortBy && { sortBy }),
          ...(lat && lng && { location: { lat, lng, radius } })
        }
      },
      data: spots
    });

  } catch (error) {
    console.error('Get All Spots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking spots',
      error: error.message
    });
  }
};

/**
 * @desc    Get nearby parking spots using geolocation
 * @route   GET /api/spots/nearby
 * @access  Public
 */
const getNearbySpots = async (req, res) => {
  try {
    // 1. Extract coordinates and radius from query
    const { lat, lng, radius = 5, limit = 20, minPrice, maxPrice, type, amenities } = req.query;

    // 2. Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for nearby search'
      });
    }

    // 3. Validate coordinate ranges
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // 4. Build query filters
    const matchQuery = {
      status: 'active',
      isActive: true
    };

    // Apply additional filters
    if (type) {
      matchQuery.type = type;
    }

    if (minPrice || maxPrice) {
      matchQuery.pricePerHour = {};
      if (minPrice) matchQuery.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) matchQuery.pricePerHour.$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) 
        ? amenities 
        : amenities.split(',').map(a => a.trim());
      matchQuery.amenities = { $all: amenitiesArray };
    }

    // 5. Build aggregation pipeline with $geoNear
    const aggregationPipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude] // [lng, lat] - GeoJSON format
          },
          distanceField: 'distance', // Add calculated distance field
          maxDistance: Number(radius) * 1000, // Convert km to meters
          spherical: true, // Use spherical geometry for Earth's curvature
          query: matchQuery,
          distanceMultiplier: 0.001 // Convert meters to kilometers in result
        }
      },
      {
        // Lookup host information
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'host'
        }
      },
      {
        // Unwind host array to object
        $unwind: '$host'
      },
      {
        // Project only needed fields
        $project: {
          'host.password': 0,
          'host.phone': 0,
          'host.email': 0,
          'host.__v': 0,
          '__v': 0
        }
      },
      {
        // Sort by distance (nearest first)
        $sort: { distance: 1 }
      },
      {
        // Limit results
        $limit: Number(limit)
      }
    ];

    // 6. Execute aggregation
    const spots = await ParkingSpot.aggregate(aggregationPipeline);

    // 7. Return response
    res.status(200).json({
      success: true,
      count: spots.length,
      searchCenter: {
        lat: latitude,
        lng: longitude
      },
      radius: `${radius} km`,
      data: spots
    });

  } catch (error) {
    console.error('Get Nearby Spots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby parking spots',
      error: error.message
    });
  }
};

/**
 * @desc    Get single parking spot by ID
 * @route   GET /api/spots/:id
 * @access  Public
 */
const getSpotById = async (req, res) => {
  try {
    // 1. Get spot ID from params
    const { id } = req.params;

    // 2. Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid spot ID format'
      });
    }

    // 3. Find spot and populate host details
    const spot = await ParkingSpot.findById(id)
      .populate({
        path: 'hostId',
        select: 'name profilePhoto trustScore aadharVerified totalReviews rating'
      })
      .populate({
        path: 'reviews',
        options: { limit: 5, sort: { createdAt: -1 } },
        populate: {
          path: 'userId',
          select: 'name profilePhoto'
        }
      });

    // 4. Check if spot exists
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 5. Return spot details
    res.status(200).json({
      success: true,
      data: spot
    });

  } catch (error) {
    console.error('Get Spot By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking spot',
      error: error.message
    });
  }
};

/**
 * @desc    Update parking spot
 * @route   PUT /api/spots/:id
 * @access  Private (Owner only)
 */
const updateSpot = async (req, res) => {
  try {
    // 1. Get spot ID from params
    const { id } = req.params;

    // 2. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 3. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this parking spot. You are not the owner.'
      });
    }

    // 4. Define fields that cannot be updated
    const restrictedFields = ['hostId', 'rating', 'totalReviews', 'totalBookings', '_id'];
    
    // Remove restricted fields from update data
    const updateData = { ...req.body };
    restrictedFields.forEach(field => delete updateData[field]);

    // 5. Update coordinates if location is being updated
    if (updateData.location && updateData.location.lat && updateData.location.lng) {
      updateData.coordinates = {
        type: 'Point',
        coordinates: [updateData.location.lng, updateData.location.lat]
      };
    }

    // 6. Update the spot
    const updatedSpot = await ParkingSpot.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    ).populate({
      path: 'hostId',
      select: 'name email profilePhoto trustScore aadharVerified'
    });

    // 7. Return updated spot
    res.status(200).json({
      success: true,
      message: 'Parking spot updated successfully',
      data: updatedSpot
    });

  } catch (error) {
    console.error('Update Spot Error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update parking spot',
      error: error.message
    });
  }
};

/**
 * @desc    Delete parking spot
 * @route   DELETE /api/spots/:id
 * @access  Private (Owner only)
 */
const deleteSpot = async (req, res) => {
  try {
    // 1. Get spot ID from params
    const { id } = req.params;

    // 2. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 3. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this parking spot. You are not the owner.'
      });
    }

    // 4. Check for active or upcoming bookings
    const activeBookings = await Booking.countDocuments({
      spotId: id,
      status: { $in: ['pending', 'confirmed', 'active'] },
      endTime: { $gte: new Date() } // Future or ongoing bookings
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete spot with ${activeBookings} active or upcoming booking(s). Please wait for bookings to complete or cancel them first.`,
        activeBookings
      });
    }

    // 5. Get force delete flag from query (optional)
    const { force } = req.query;

    if (force === 'true') {
      // Hard delete - permanently remove from database
      await ParkingSpot.findByIdAndDelete(id);

      // Optionally delete associated photos from Cloudinary
      if (spot.photos && spot.photos.length > 0) {
        for (const photoUrl of spot.photos) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = photoUrl.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(`parkease/parking-spots/${publicId}`);
          } catch (photoError) {
            console.error('Error deleting photo from Cloudinary:', photoError);
            // Continue even if photo deletion fails
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Parking spot permanently deleted',
        deletionType: 'hard'
      });
    } else {
      // Soft delete - mark as inactive
      spot.isActive = false;
      spot.status = 'inactive';
      await spot.save();

      return res.status(200).json({
        success: true,
        message: 'Parking spot deactivated successfully. You can reactivate it later.',
        deletionType: 'soft',
        data: spot
      });
    }

  } catch (error) {
    console.error('Delete Spot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete parking spot',
      error: error.message
    });
  }
};

/**
 * @desc    Upload photos to parking spot
 * @route   POST /api/spots/:id/photos
 * @access  Private (Owner only)
 */
const uploadPhotos = async (req, res) => {
  try {
    // 1. Get spot ID from params
    const { id } = req.params;

    // 2. Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one photo'
      });
    }

    // 3. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 4. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload photos to this parking spot'
      });
    }

    // 5. Check total photo count (max 10)
    const currentPhotoCount = spot.photos ? spot.photos.length : 0;
    const newPhotoCount = req.files.length;
    const totalPhotoCount = currentPhotoCount + newPhotoCount;

    if (totalPhotoCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${newPhotoCount} photo(s). Maximum 10 photos allowed. Current: ${currentPhotoCount}`,
        maxPhotos: 10,
        currentCount: currentPhotoCount
      });
    }

    // 6. Upload photos to Cloudinary
    const uploadedPhotos = [];
    const uploadErrors = [];

    for (const file of req.files) {
      try {
        // Upload to Cloudinary with transformations
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'parkease/parking-spots',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          resource_type: 'image'
        });

        uploadedPhotos.push(result.secure_url);
      } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        uploadErrors.push({
          file: file.originalname,
          error: uploadError.message
        });
      }
    }

    // 7. Check if any uploads were successful
    if (uploadedPhotos.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload photos to cloud storage',
        errors: uploadErrors
      });
    }

    // 8. Add new photos to spot
    spot.photos = [...(spot.photos || []), ...uploadedPhotos];
    await spot.save();

    // 9. Return response
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
      uploadedCount: uploadedPhotos.length,
      failedCount: uploadErrors.length,
      totalPhotos: spot.photos.length,
      data: {
        photos: spot.photos,
        newPhotos: uploadedPhotos
      },
      ...(uploadErrors.length > 0 && { errors: uploadErrors })
    });

  } catch (error) {
    console.error('Upload Photos Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a photo from parking spot
 * @route   DELETE /api/spots/:id/photos/:photoIndex
 * @access  Private (Owner only)
 */
const deletePhoto = async (req, res) => {
  try {
    // 1. Get spot ID and photo index from params
    const { id, photoIndex } = req.params;

    // 2. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 3. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete photos from this parking spot'
      });
    }

    // 4. Validate photo index
    const index = Number(photoIndex);
    if (isNaN(index) || index < 0 || index >= spot.photos.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo index',
        totalPhotos: spot.photos.length
      });
    }

    // 5. Check minimum photo requirement
    if (spot.photos.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last photo. At least one photo is required.'
      });
    }

    // 6. Get the photo URL to delete
    const photoUrl = spot.photos[index];

    // 7. Delete from Cloudinary
    try {
      // Extract public_id from Cloudinary URL
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/parkease/parking-spots/image123.jpg
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const folder = urlParts.slice(-2, -1)[0];
      const publicId = `parkease/parking-spots/${filename}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue even if Cloudinary deletion fails
    }

    // 8. Remove photo from array
    spot.photos.splice(index, 1);
    await spot.save();

    // 9. Return response
    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      remainingPhotos: spot.photos.length,
      data: {
        photos: spot.photos
      }
    });

  } catch (error) {
    console.error('Delete Photo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
};

/**
 * @desc    Update parking spot availability
 * @route   PATCH /api/spots/:id/availability
 * @access  Private (Owner only)
 */
const updateAvailability = async (req, res) => {
  try {
    // 1. Get spot ID from params
    const { id } = req.params;

    // 2. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 3. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update availability for this parking spot'
      });
    }

    // 4. Get availability data from request body
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be an array of time slots'
      });
    }

    // 5. Validate availability data
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const slot of availability) {
      // Check required fields
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Each availability slot must have day, startTime, and endTime'
        });
      }

      // Validate day
      if (!validDays.includes(slot.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${slot.day}. Must be one of: ${validDays.join(', ')}`
        });
      }

      // Validate time format
      if (!timeFormat.test(slot.startTime) || !timeFormat.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:MM format (24-hour)'
        });
      }

      // Validate start time is before end time
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          success: false,
          message: `Start time must be before end time for ${slot.day}`
        });
      }
    }

    // 6. Check for duplicate days
    const days = availability.map(slot => slot.day);
    const uniqueDays = new Set(days);
    if (days.length !== uniqueDays.size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate days found in availability. Each day can only appear once.'
      });
    }

    // 7. Update availability
    spot.availability = availability;
    await spot.save();

    // 8. Return response
    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: spot.availability
      }
    });

  } catch (error) {
    console.error('Update Availability Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};

/**
 * @desc    Update parking spot status
 * @route   PATCH /api/spots/:id/status
 * @access  Private (Owner only)
 */
const updateStatus = async (req, res) => {
  try {
    // 1. Get spot ID and new status from params
    const { id } = req.params;
    const { status } = req.body;

    // 2. Validate status
    const validStatuses = ['active', 'inactive', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // 3. Find the spot
    const spot = await ParkingSpot.findById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // 4. Verify ownership
    if (spot.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update status for this parking spot'
      });
    }

    // 5. Update status
    spot.status = status;
    spot.isActive = status === 'active';
    await spot.save();

    // 6. Return response
    res.status(200).json({
      success: true,
      message: `Parking spot status updated to ${status}`,
      data: {
        status: spot.status,
        isActive: spot.isActive
      }
    });

  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * @desc    Get host's own parking spots
 * @route   GET /api/spots/my-spots
 * @access  Private (Host only)
 */
const getMySpots = async (req, res) => {
  try {
    // 1. Extract query parameters
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // 2. Build query
    const query = {
      hostId: req.user._id
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // 3. Build sort criteria
    const sortCriteria = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    // 4. Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 5. Get total count
    const totalResults = await ParkingSpot.countDocuments(query);

    // 6. Fetch spots
    const spots = await ParkingSpot.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // 7. Calculate pagination metadata
    const totalPages = Math.ceil(totalResults / Number(limit));

    // 8. Return response
    res.status(200).json({
      success: true,
      count: spots.length,
      pagination: {
        currentPage: Number(page),
        totalPages,
        limit: Number(limit),
        totalResults,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      data: spots
    });

  } catch (error) {
    console.error('Get My Spots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your parking spots',
      error: error.message
    });
  }
};

module.exports = {
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
};
