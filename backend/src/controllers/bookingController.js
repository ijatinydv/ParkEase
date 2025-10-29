const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');
const Transaction = require('../models/Transaction');
const cloudinary = require('../config/cloudinary');
const {
  calculateBookingAmount,
  checkAvailability,
  calculateRefund,
  validateCheckInTiming,
  validateCheckOutTiming,
  calculateOvertimeCharge,
  canCancelBooking,
  generateBookingTimeline
} = require('../utils/bookingHelpers');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (Seeker only)
 */
const createBooking = async (req, res) => {
  try {
    const {
      spotId,
      startTime,
      endTime,
      vehicleNumber,
      vehicleType,
      specialInstructions
    } = req.body;

    const seekerId = req.user._id; // From auth middleware

    // Step 1: Check if spot exists and is active
    const spot = await ParkingSpot.findById(spotId).populate(
      'hostId',
      'name email phone'
    );

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    if (spot.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Parking spot is currently ${spot.status}`
      });
    }

    // Step 2: Check if vehicle type is supported by the spot
    if (!spot.vehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: `This spot does not support ${vehicleType}. Supported types: ${spot.vehicleTypes.join(', ')}`
      });
    }

    // Step 3: Verify user is not the host (cannot book own spot)
    if (spot.hostId._id.toString() === seekerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own parking spot'
      });
    }

    // Step 4: Check availability for the requested time
    const availabilityCheck = await checkAvailability(
      spotId,
      startTime,
      endTime
    );

    if (!availabilityCheck.available) {
      return res.status(409).json({
        success: false,
        message: availabilityCheck.reason,
        code: availabilityCheck.code,
        details: availabilityCheck
      });
    }

    // Step 5: Calculate pricing
    const pricing = calculateBookingAmount(spot, startTime, endTime);

    // Step 6: Create booking in 'pending' state
    const booking = await Booking.create({
      spotId,
      seekerId,
      hostId: spot.hostId._id,
      startTime,
      endTime,
      duration: pricing.duration.hours,
      vehicleNumber,
      vehicleType,
      totalAmount: pricing.totalAmount,
      platformFee: pricing.platformFee,
      hostEarnings: pricing.hostEarnings,
      status: 'pending',
      specialInstructions: specialInstructions || ''
    });

    // Step 7: TODO - Initiate Razorpay payment order
    // This will be implemented when Razorpay integration is added
    // For now, we'll create a placeholder payment record

    const paymentOrder = {
      orderId: `order_${Date.now()}_${booking._id}`,
      amount: pricing.totalAmount,
      currency: 'INR',
      status: 'created'
    };

    // Update booking with payment order ID
    booking.razorpayOrderId = paymentOrder.orderId;
    await booking.save();

    // Create transaction record
    await Transaction.create({
      bookingId: booking._id,
      userId: seekerId,
      type: 'payment',
      amount: pricing.totalAmount,
      platformFee: pricing.platformFee,
      netAmount: pricing.hostEarnings,
      status: 'pending',
      razorpayOrderId: paymentOrder.orderId,
      description: `Payment for parking at ${spot.title}`
    });

    // Populate booking details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('spotId', 'title location photos amenities pricePerHour pricePerDay')
      .populate('hostId', 'name email phone profilePicture')
      .populate('seekerId', 'name email phone profilePicture');

    // Calculate payment deadline (15 minutes from now)
    const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete payment within 15 minutes.',
      data: {
        booking: populatedBooking,
        pricing: {
          baseAmount: pricing.baseAmount,
          platformFee: pricing.platformFee,
          gst: pricing.gst,
          totalAmount: pricing.totalAmount,
          hostEarnings: pricing.hostEarnings,
          breakdown: pricing.breakdown
        },
        payment: {
          orderId: paymentOrder.orderId,
          amount: pricing.totalAmount,
          currency: 'INR',
          deadline: paymentDeadline
        }
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);

    // Handle duplicate booking error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.',
        code: 'DUPLICATE_BOOKING'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's bookings (filtered by role)
 * @route   GET /api/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      role = 'seeker', // Default to seeker bookings
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Build query based on role
    let query = {};

    if (role === 'seeker') {
      query.seekerId = userId;
    } else if (role === 'host') {
      // Find all spots owned by the user
      const userSpots = await ParkingSpot.find({ hostId: userId }).select('_id');
      const spotIds = userSpots.map(spot => spot._id);
      query.spotId = { $in: spotIds };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "seeker" or "host"'
      });
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('spotId', 'title location photos amenities pricePerHour pricePerDay rating')
        .populate('seekerId', 'name email phone profilePicture')
        .populate('hostId', 'name email phone profilePicture')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    // Add computed fields to each booking
    const now = new Date();
    const enrichedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();

      // Calculate time until start
      const timeUntilStart = new Date(booking.startTime) - now;
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

      // Add permissions and status flags
      bookingObj.permissions = {
        canCancel: ['pending', 'confirmed'].includes(booking.status) && hoursUntilStart >= 2,
        canCheckIn: booking.status === 'confirmed' && hoursUntilStart <= 0.5 && hoursUntilStart >= -1,
        canCheckOut: booking.status === 'checkedIn',
        canReview: booking.status === 'completed' && !booking.isReviewed,
        canDispute: ['confirmed', 'checkedIn', 'checkedOut'].includes(booking.status)
      };

      // Add time-based info
      bookingObj.timeInfo = {
        hoursUntilStart: Math.max(0, Math.round(hoursUntilStart * 10) / 10),
        hasStarted: now >= new Date(booking.startTime),
        hasEnded: now >= new Date(booking.endTime),
        isActive: booking.status === 'checkedIn',
        isUpcoming: booking.status === 'confirmed' && now < new Date(booking.startTime)
      };

      return bookingObj;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        bookings: enrichedBookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          role,
          status: status || 'all',
          dateRange: {
            start: startDate || null,
            end: endDate || null
          }
        }
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Get single booking details
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find booking with all details
    const booking = await Booking.findById(id)
      .populate('spotId')
      .populate('seekerId', 'name email phone profilePicture')
      .populate('hostId', 'name email phone profilePicture');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is either seeker or host
    const isSeeker = booking.seekerId._id.toString() === userId.toString();
    const isHost = booking.hostId._id.toString() === userId.toString();

    if (!isSeeker && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

    // Generate timeline
    const timeline = generateBookingTimeline(booking);

    // Calculate permissions
    const now = new Date();
    const timeUntilStart = (new Date(booking.startTime) - now) / (1000 * 60 * 60);

    const permissions = {
      canCancel: canCancelBooking(booking, userId).allowed,
      canCheckIn: isSeeker && booking.status === 'confirmed' && timeUntilStart <= 0.5 && timeUntilStart >= -1,
      canCheckOut: isSeeker && booking.status === 'checkedIn',
      canReview: booking.status === 'completed' && !booking.isReviewed,
      canDispute: ['confirmed', 'checkedIn', 'checkedOut'].includes(booking.status)
    };

    const bookingObj = booking.toObject();
    bookingObj.timeline = timeline;
    bookingObj.permissions = permissions;
    bookingObj.userRole = isSeeker ? 'seeker' : 'host';

    res.status(200).json({
      success: true,
      data: {
        booking: bookingObj
      }
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error.message
    });
  }
};

/**
 * @desc    Check-in to booking
 * @route   PATCH /api/bookings/:id/checkin
 * @access  Private (Seeker only)
 */
const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { notes, location } = req.body;

    // Find booking
    const booking = await Booking.findById(id).populate('spotId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is the seeker
    if (booking.seekerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seeker can check in to this booking'
      });
    }

    // Check booking status
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in. Booking status is: ${booking.status}`,
        currentStatus: booking.status
      });
    }

    // Validate check-in timing
    const timingValidation = validateCheckInTiming(booking);

    if (!timingValidation.valid) {
      // Handle no-show case
      if (timingValidation.code === 'NO_SHOW') {
        // Auto-cancel booking
        await booking.cancel(userId, 'No-show - check-in window expired');

        // Create penalty transaction
        await Transaction.create({
          bookingId: booking._id,
          userId: booking.seekerId,
          type: 'penalty',
          amount: booking.totalAmount,
          platformFee: 0,
          netAmount: booking.totalAmount,
          status: 'completed',
          description: 'No-show penalty'
        });

        return res.status(400).json({
          success: false,
          message: timingValidation.reason,
          code: timingValidation.code,
          penaltyApplied: true
        });
      }

      return res.status(400).json({
        success: false,
        message: timingValidation.reason,
        code: timingValidation.code,
        details: timingValidation
      });
    }

    // Validate location if provided
    if (location && location.lat && location.lng) {
      const spotLocation = booking.spotId.location;
      const distance = calculateDistance(
        location.lat,
        location.lng,
        spotLocation.lat,
        spotLocation.lng
      );

      // Allow 200m radius for GPS variations
      if (distance > 200) {
        return res.status(400).json({
          success: false,
          message: 'You are too far from the parking spot to check in',
          distance: Math.round(distance),
          maxDistance: 200,
          code: 'LOCATION_MISMATCH'
        });
      }
    }

    // Upload photos to Cloudinary
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      // Limit to 5 photos
      const photosToUpload = req.files.slice(0, 5);

      const uploadPromises = photosToUpload.map(file => {
        return cloudinary.uploader.upload(file.path, {
          folder: `parkease/bookings/${booking._id}/checkin`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      photoUrls = uploadResults.map(result => result.secure_url);
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required for check-in'
      });
    }

    // Update booking with check-in details
    booking.status = 'checkedIn';
    booking.checkIn = {
      photos: photoUrls,
      timestamp: new Date(),
      notes: notes || '',
      isLate: timingValidation.isLate || false,
      minutesLate: timingValidation.minutesLate || 0,
      location: location || null
    };

    await booking.save();

    // TODO: Trigger AI photo verification (placeholder)
    // This would compare check-in photos with spot listing photos
    // For now, we'll just log it
    console.log(`AI verification needed for booking ${booking._id}`);

    // Send notification to host (implement later)
    // notifyHost(booking.hostId, 'Seeker has checked in to your parking spot');

    res.status(200).json({
      success: true,
      message: timingValidation.isLate
        ? `Late check-in successful (${timingValidation.minutesLate} minutes late)`
        : 'Check-in successful',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          checkIn: booking.checkIn,
          isLate: timingValidation.isLate || false
        }
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing check-in',
      error: error.message
    });
  }
};

/**
 * @desc    Check-out from booking
 * @route   PATCH /api/bookings/:id/checkout
 * @access  Private (Seeker only)
 */
const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { notes, location } = req.body;

    // Find booking
    const booking = await Booking.findById(id).populate('spotId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is the seeker
    if (booking.seekerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seeker can check out from this booking'
      });
    }

    // Check booking status
    if (booking.status !== 'checkedIn') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out. Booking status is: ${booking.status}`,
        currentStatus: booking.status
      });
    }

    // Validate check-out timing
    const timingValidation = validateCheckOutTiming(booking);

    if (!timingValidation.valid) {
      return res.status(400).json({
        success: false,
        message: timingValidation.reason,
        code: timingValidation.code
      });
    }

    // Upload photos to Cloudinary
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      const photosToUpload = req.files.slice(0, 5);

      const uploadPromises = photosToUpload.map(file => {
        return cloudinary.uploader.upload(file.path, {
          folder: `parkease/bookings/${booking._id}/checkout`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      photoUrls = uploadResults.map(result => result.secure_url);
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required for check-out'
      });
    }

    // Calculate overtime charges if applicable
    let overtimeDetails = null;
    let additionalCharge = 0;

    if (timingValidation.isOvertime) {
      overtimeDetails = calculateOvertimeCharge(
        timingValidation.overtimeHours,
        booking.spotId.pricePerHour
      );
      additionalCharge = overtimeDetails.overtimeCharge;

      // Create additional payment transaction
      await Transaction.create({
        bookingId: booking._id,
        userId: booking.seekerId,
        type: 'payment',
        amount: additionalCharge,
        platformFee: overtimeDetails.platformFee,
        netAmount: overtimeDetails.hostEarnings,
        status: 'pending',
        description: `Overtime charges: ${overtimeDetails.message}`
      });
    }

    // Update booking with check-out details
    booking.status = 'checkedOut';
    booking.checkOut = {
      photos: photoUrls,
      timestamp: new Date(),
      notes: notes || '',
      location: location || null,
      overtimeHours: timingValidation.overtimeHours || 0,
      overtimeCharge: additionalCharge
    };

    // Update total amount if overtime
    if (additionalCharge > 0) {
      booking.totalAmount += additionalCharge;
      booking.platformFee += overtimeDetails.platformFee;
      booking.hostEarnings += overtimeDetails.hostEarnings;
    }

    await booking.save();

    // Schedule payout to host after 24-hour dispute window
    // This would be handled by a background job
    console.log(`Schedule payout for booking ${booking._id} after 24 hours`);

    // Send notification to host
    // notifyHost(booking.hostId, 'Seeker has checked out. Payout will be processed after 24 hours.');

    res.status(200).json({
      success: true,
      message: 'Check-out successful. Payout will be processed to host after 24 hours.',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          checkOut: booking.checkOut,
          finalAmount: booking.totalAmount,
          overtime: overtimeDetails
        }
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing check-out',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason, reasonCode } = req.body;

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can cancel
    const cancellationCheck = canCancelBooking(booking, userId);

    if (!cancellationCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: cancellationCheck.reason,
        code: cancellationCheck.code
      });
    }

    // Calculate refund
    const refundDetails = calculateRefund(booking);

    // Cancel the booking
    await booking.cancel(userId, reason || 'User requested cancellation');

    // Process refund if applicable
    if (refundDetails.refundAmount > 0) {
      // TODO: Initiate Razorpay refund
      // For now, create a refund transaction
      await Transaction.create({
        bookingId: booking._id,
        userId: booking.seekerId,
        type: 'refund',
        amount: refundDetails.refundAmount,
        platformFee: 0,
        netAmount: refundDetails.refundAmount,
        status: 'pending',
        refundReason: reason || 'User requested cancellation',
        description: `Refund: ${refundDetails.reason}`
      });
    }

    // If host cancels, apply penalty
    if (cancellationCheck.userRole === 'host') {
      const hostPenalty = Math.round(booking.hostEarnings * 0.1); // 10% penalty
      await Transaction.create({
        bookingId: booking._id,
        userId: booking.hostId,
        type: 'penalty',
        amount: hostPenalty,
        platformFee: 0,
        netAmount: hostPenalty,
        status: 'completed',
        description: 'Host cancellation penalty (10%)'
      });
    }

    // Send notifications
    // notifyUser(booking.seekerId, 'Your booking has been cancelled');
    // notifyUser(booking.hostId, 'Booking has been cancelled');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          cancelledAt: booking.cancelledAt,
          cancelledBy: cancellationCheck.userRole
        },
        refund: {
          amount: refundDetails.refundAmount,
          percentage: refundDetails.refundPercentage,
          reason: refundDetails.reason,
          estimatedArrival: refundDetails.refundAmount > 0 ? '5-7 business days' : null
        }
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

/**
 * @desc    Raise a dispute for a booking
 * @route   POST /api/bookings/:id/dispute
 * @access  Private
 */
const raiseDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason, category } = req.body;

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is either seeker or host
    const isSeeker = booking.seekerId.toString() === userId.toString();
    const isHost = booking.hostId.toString() === userId.toString();

    if (!isSeeker && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to raise a dispute for this booking'
      });
    }

    // Check if booking can be disputed
    const disputeableStatuses = ['confirmed', 'checkedIn', 'checkedOut'];
    if (!disputeableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot raise dispute for booking with status: ${booking.status}`
      });
    }

    // Upload evidence photos to Cloudinary if provided
    let evidenceUrls = [];
    if (req.files && req.files.length > 0) {
      const photosToUpload = req.files.slice(0, 10);

      const uploadPromises = photosToUpload.map(file => {
        return cloudinary.uploader.upload(file.path, {
          folder: `parkease/disputes/${booking._id}`,
          resource_type: 'image'
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      evidenceUrls = uploadResults.map(result => result.secure_url);
    }

    // Raise dispute
    await booking.raiseDispute(userId, reason);

    // Store evidence if any
    if (evidenceUrls.length > 0) {
      booking.disputeEvidence = evidenceUrls;
      booking.disputeCategory = category;
      await booking.save();
    }

    // Freeze payout if booking is checked out
    // This would be handled by checking dispute status in payout processing

    // Send notifications
    const otherParty = isSeeker ? booking.hostId : booking.seekerId;
    // notifyUser(otherParty, 'A dispute has been raised for your booking');
    // notifyAdmin('New dispute requires review');

    res.status(200).json({
      success: true,
      message: 'Dispute raised successfully. Our team will review within 48 hours.',
      data: {
        dispute: {
          bookingId: booking._id,
          category,
          status: 'under_review',
          raisedBy: isSeeker ? 'seeker' : 'host',
          raisedAt: booking.disputeRaisedAt,
          expectedResolution: new Date(Date.now() + 48 * 60 * 60 * 1000),
          evidenceCount: evidenceUrls.length
        }
      }
    });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Error raising dispute',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  checkIn,
  checkOut,
  cancelBooking,
  raiseDispute
};
