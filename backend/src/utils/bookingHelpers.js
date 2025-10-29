const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');

/**
 * Calculate booking amount based on duration and spot pricing
 * @param {Object} spot - The parking spot object
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @returns {Object} - Pricing breakdown
 */
const calculateBookingAmount = (spot, startTime, endTime) => {
  // Calculate duration
  const durationMs = new Date(endTime) - new Date(startTime);
  const durationHours = durationMs / (1000 * 60 * 60);
  const durationDays = durationMs / (1000 * 60 * 60 * 24);

  let baseAmount = 0;

  // Use daily rate if booking >= 6 hours (more economical for users)
  if (durationHours >= 6) {
    const fullDays = Math.floor(durationDays);
    const remainingHours = (durationDays - fullDays) * 24;

    baseAmount =
      fullDays * spot.pricePerDay +
      Math.ceil(remainingHours) * spot.pricePerHour;
  } else {
    // Use hourly rate for shorter durations
    baseAmount = Math.ceil(durationHours) * spot.pricePerHour;
  }

  // Platform fee: 15%
  const platformFee = Math.round((baseAmount * 15) / 100);
  const hostEarnings = baseAmount - platformFee;

  // GST: 18% on platform fee (India tax structure)
  const gst = Math.round((platformFee * 18) / 100);
  const totalAmount = baseAmount + gst;

  return {
    baseAmount,
    platformFee,
    gst,
    totalAmount,
    hostEarnings,
    duration: {
      hours: Math.ceil(durationHours),
      days: Math.ceil(durationDays),
      milliseconds: durationMs
    },
    breakdown: {
      durationHours: Math.ceil(durationHours),
      durationDays: Math.ceil(durationDays),
      pricePerHour: spot.pricePerHour,
      pricePerDay: spot.pricePerDay,
      calculationMethod: durationHours >= 6 ? 'daily' : 'hourly'
    }
  };
};

/**
 * Check if a spot is available for the requested time period
 * @param {String} spotId - The parking spot ID
 * @param {Date} startTime - Requested start time
 * @param {Date} endTime - Requested end time
 * @param {String} excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns {Object} - Availability status and details
 */
const checkAvailability = async (
  spotId,
  startTime,
  endTime,
  excludeBookingId = null
) => {
  try {
    // Step 1: Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return {
        available: false,
        reason: 'Start time must be in the future',
        code: 'INVALID_START_TIME'
      };
    }

    if (end <= start) {
      return {
        available: false,
        reason: 'End time must be after start time',
        code: 'INVALID_TIME_RANGE'
      };
    }

    // Step 2: Check if spot exists and is active
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return {
        available: false,
        reason: 'Parking spot not found',
        code: 'SPOT_NOT_FOUND'
      };
    }

    if (spot.status !== 'active') {
      return {
        available: false,
        reason: `Spot is ${spot.status}`,
        code: 'SPOT_NOT_ACTIVE'
      };
    }

    // Step 3: Check spot availability schedule (day/time)
    const isWithinSchedule = checkSchedule(spot.availability, start, end);
    if (!isWithinSchedule.available) {
      return {
        available: false,
        reason: isWithinSchedule.reason,
        code: 'OUTSIDE_SCHEDULE'
      };
    }

    // Step 4: Check for overlapping bookings
    const overlappingBookings = await Booking.findConflicting(
      spotId,
      start,
      end,
      excludeBookingId
    );

    if (overlappingBookings.length >= spot.capacity) {
      return {
        available: false,
        reason: 'Spot is fully booked for this time period',
        code: 'FULLY_BOOKED',
        conflictingBookings: overlappingBookings.length,
        capacity: spot.capacity
      };
    }

    // Step 5: Check buffer time between bookings (15 minutes)
    const hasBuffer = checkBufferTime(overlappingBookings, start, end);
    if (!hasBuffer) {
      return {
        available: false,
        reason:
          'Insufficient buffer time between bookings (15 min required)',
        code: 'INSUFFICIENT_BUFFER'
      };
    }

    // Spot is available!
    return {
      available: true,
      remainingCapacity: spot.capacity - overlappingBookings.length,
      spot: {
        id: spot._id,
        title: spot.title,
        pricePerHour: spot.pricePerHour,
        pricePerDay: spot.pricePerDay
      }
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      available: false,
      reason: 'Error checking availability',
      code: 'AVAILABILITY_CHECK_ERROR',
      error: error.message
    };
  }
};

/**
 * Check if booking time falls within spot's availability schedule
 * @param {Array} availabilitySlots - Spot's availability schedule
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @returns {Object} - Whether the time is within schedule
 */
const checkSchedule = (availabilitySlots, startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Get day of week for start and end times
  const startDay = start.toLocaleDateString('en-US', { weekday: 'long' });
  const endDay = end.toLocaleDateString('en-US', { weekday: 'long' });

  // Find availability for start day
  const startDaySlot = availabilitySlots.find(slot => slot.day === startDay);

  if (!startDaySlot) {
    return {
      available: false,
      reason: `Spot not available on ${startDay}`
    };
  }

  // If booking spans multiple days, check end day as well
  if (startDay !== endDay) {
    const endDaySlot = availabilitySlots.find(slot => slot.day === endDay);
    if (!endDaySlot) {
      return {
        available: false,
        reason: `Spot not available on ${endDay}`
      };
    }
  }

  // Get time components (HH:MM)
  const startTimeStr = start.toTimeString().slice(0, 5); // "HH:MM"
  const endTimeStr = end.toTimeString().slice(0, 5); // "HH:MM"

  // Check if start time is within slot
  if (
    startTimeStr < startDaySlot.startTime ||
    startTimeStr > startDaySlot.endTime
  ) {
    return {
      available: false,
      reason: `Start time ${startTimeStr} is outside available hours (${startDaySlot.startTime} - ${startDaySlot.endTime})`
    };
  }

  // For same-day bookings, check end time
  if (startDay === endDay) {
    if (
      endTimeStr < startDaySlot.startTime ||
      endTimeStr > startDaySlot.endTime
    ) {
      return {
        available: false,
        reason: `End time ${endTimeStr} is outside available hours (${startDaySlot.startTime} - ${startDaySlot.endTime})`
      };
    }
  }

  return { available: true };
};

/**
 * Check buffer time between bookings (15 minutes recommended)
 * @param {Array} existingBookings - Array of existing bookings
 * @param {Date} newStart - New booking start time
 * @param {Date} newEnd - New booking end time
 * @returns {Boolean} - Whether sufficient buffer exists
 */
const checkBufferTime = (existingBookings, newStart, newEnd) => {
  const BUFFER_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

  const start = new Date(newStart);
  const end = new Date(newEnd);

  for (const booking of existingBookings) {
    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);

    // Check if new booking ends too close to existing booking start
    const gapBeforeExisting = existingStart - end;
    if (gapBeforeExisting > 0 && gapBeforeExisting < BUFFER_MS) {
      return false;
    }

    // Check if new booking starts too close to existing booking end
    const gapAfterExisting = start - existingEnd;
    if (gapAfterExisting > 0 && gapAfterExisting < BUFFER_MS) {
      return false;
    }
  }

  return true;
};

/**
 * Calculate refund amount based on cancellation time
 * @param {Object} booking - The booking object
 * @param {Date} cancellationTime - When the cancellation is happening
 * @returns {Object} - Refund details
 */
const calculateRefund = (booking, cancellationTime = new Date()) => {
  const now = new Date(cancellationTime);
  const startTime = new Date(booking.startTime);
  const bookingStatus = booking.status;

  // No refund if booking already started (checked-in or later)
  if (['checkedIn', 'checkedOut', 'completed'].includes(bookingStatus)) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      platformRetention: booking.totalAmount,
      reason: 'Booking already started - no refund applicable'
    };
  }

  // Calculate hours until start
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

  let refundPercentage = 0;

  // Refund policy based on cancellation window
  if (hoursUntilStart >= 24) {
    refundPercentage = 100; // Full refund
  } else if (hoursUntilStart >= 12) {
    refundPercentage = 75; // 75% refund
  } else if (hoursUntilStart >= 2) {
    refundPercentage = 50; // 50% refund
  } else {
    refundPercentage = 0; // No refund
  }

  const refundAmount = Math.round(
    (booking.totalAmount * refundPercentage) / 100
  );
  const platformRetention = booking.totalAmount - refundAmount;

  return {
    refundAmount,
    refundPercentage,
    platformRetention,
    hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
    reason: getRefundReason(refundPercentage, hoursUntilStart)
  };
};

/**
 * Get human-readable refund reason
 * @param {Number} percentage - Refund percentage
 * @param {Number} hoursUntilStart - Hours until booking start
 * @returns {String} - Refund reason
 */
const getRefundReason = (percentage, hoursUntilStart) => {
  if (percentage === 100) {
    return `Full refund - cancelled more than 24 hours in advance`;
  } else if (percentage === 75) {
    return `75% refund - cancelled 12-24 hours in advance`;
  } else if (percentage === 50) {
    return `50% refund - cancelled 2-12 hours in advance`;
  } else {
    return `No refund - cancelled less than 2 hours before start time`;
  }
};

/**
 * Validate check-in timing
 * @param {Object} booking - The booking object
 * @param {Date} checkInTime - Attempted check-in time
 * @returns {Object} - Validation result
 */
const validateCheckInTiming = (booking, checkInTime = new Date()) => {
  const now = new Date(checkInTime);
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  // Can check in 30 minutes before start time
  const earliestCheckIn = new Date(startTime.getTime() - 30 * 60 * 1000);

  // Can check in up to 60 minutes after start time (late check-in)
  const latestCheckIn = new Date(startTime.getTime() + 60 * 60 * 1000);

  const minutesLate = (now - startTime) / (1000 * 60);

  // Too early
  if (now < earliestCheckIn) {
    return {
      valid: false,
      reason: 'Too early for check-in',
      code: 'TOO_EARLY',
      earliestCheckIn
    };
  }

  // Too late - no show
  if (now > latestCheckIn) {
    return {
      valid: false,
      reason: 'Check-in window expired - marked as no-show',
      code: 'NO_SHOW',
      latestCheckIn
    };
  }

  // Already ended
  if (now > endTime) {
    return {
      valid: false,
      reason: 'Booking period has ended',
      code: 'BOOKING_ENDED'
    };
  }

  // Late check-in (31-60 minutes late)
  if (minutesLate > 30) {
    return {
      valid: true,
      isLate: true,
      minutesLate: Math.round(minutesLate),
      warning: `Late check-in by ${Math.round(minutesLate)} minutes`
    };
  }

  // On-time check-in
  return {
    valid: true,
    isLate: false,
    minutesLate: Math.max(0, Math.round(minutesLate))
  };
};

/**
 * Validate check-out timing
 * @param {Object} booking - The booking object
 * @param {Date} checkOutTime - Attempted check-out time
 * @returns {Object} - Validation result with overtime charges
 */
const validateCheckOutTiming = (booking, checkOutTime = new Date()) => {
  const now = new Date(checkOutTime);
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const checkInTime = booking.checkIn?.timestamp
    ? new Date(booking.checkIn.timestamp)
    : null;

  // Must have checked in first
  if (!checkInTime) {
    return {
      valid: false,
      reason: 'Must check in before checking out',
      code: 'NOT_CHECKED_IN'
    };
  }

  // Cannot check out before check-in
  if (now < checkInTime) {
    return {
      valid: false,
      reason: 'Check-out time cannot be before check-in time',
      code: 'INVALID_CHECKOUT_TIME'
    };
  }

  // Calculate if there's overtime
  let overtimeCharge = 0;
  let overtimeHours = 0;

  if (now > endTime) {
    // Calculate overtime hours
    overtimeHours = Math.ceil((now - endTime) / (1000 * 60 * 60));

    // Get spot details for pricing (will be fetched in controller)
    // Overtime rate is 1.5x the hourly rate
    // This will be calculated in the controller with actual spot data
  }

  return {
    valid: true,
    isOvertime: overtimeHours > 0,
    overtimeHours,
    actualDuration: {
      hours: Math.ceil((now - checkInTime) / (1000 * 60 * 60)),
      milliseconds: now - checkInTime
    }
  };
};

/**
 * Calculate overtime charges
 * @param {Number} overtimeHours - Hours of overtime
 * @param {Number} pricePerHour - Spot's hourly rate
 * @returns {Object} - Overtime charge details
 */
const calculateOvertimeCharge = (overtimeHours, pricePerHour) => {
  const OVERTIME_MULTIPLIER = 1.5; // 1.5x surge for overtime

  const overtimeRate = Math.round(pricePerHour * OVERTIME_MULTIPLIER);
  const overtimeCharge = overtimeHours * overtimeRate;

  // Calculate platform fee on overtime charge
  const platformFee = Math.round((overtimeCharge * 15) / 100);
  const hostEarnings = overtimeCharge - platformFee;

  return {
    overtimeHours,
    overtimeRate,
    overtimeCharge,
    platformFee,
    hostEarnings,
    message: `${overtimeHours} hour(s) overtime at ₹${overtimeRate}/hr (1.5x rate)`
  };
};

/**
 * Check if user can cancel booking
 * @param {Object} booking - The booking object
 * @param {String} userId - User attempting to cancel
 * @returns {Object} - Whether cancellation is allowed
 */
const canCancelBooking = (booking, userId) => {
  const now = new Date();
  const startTime = new Date(booking.startTime);

  // Check if user is authorized (seeker or host)
  const isSeeker = booking.seekerId.toString() === userId.toString();
  const isHost = booking.hostId.toString() === userId.toString();

  if (!isSeeker && !isHost) {
    return {
      allowed: false,
      reason: 'You are not authorized to cancel this booking',
      code: 'UNAUTHORIZED'
    };
  }

  // Check if booking can be cancelled based on status
  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(booking.status)) {
    return {
      allowed: false,
      reason: `Cannot cancel booking with status: ${booking.status}`,
      code: 'INVALID_STATUS'
    };
  }

  // Check if within cancellation window (2 hours minimum)
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

  if (hoursUntilStart < 2) {
    return {
      allowed: false,
      reason:
        'Cannot cancel within 2 hours of start time (no refund applicable)',
      code: 'CANCELLATION_WINDOW_CLOSED',
      hoursUntilStart: Math.round(hoursUntilStart * 10) / 10
    };
  }

  return {
    allowed: true,
    userRole: isSeeker ? 'seeker' : 'host',
    hoursUntilStart: Math.round(hoursUntilStart * 10) / 10
  };
};

/**
 * Generate booking timeline for display
 * @param {Object} booking - The booking object
 * @returns {Array} - Timeline events
 */
const generateBookingTimeline = booking => {
  const timeline = [];

  // Booking created
  timeline.push({
    status: 'pending',
    timestamp: booking.createdAt,
    event: 'Booking created',
    description: 'Booking initiated and payment pending'
  });

  // Payment confirmed
  if (
    ['confirmed', 'checkedIn', 'checkedOut', 'completed'].includes(
      booking.status
    )
  ) {
    timeline.push({
      status: 'confirmed',
      timestamp: booking.updatedAt, // Approximate
      event: 'Payment confirmed',
      description: 'Booking confirmed and spot reserved'
    });
  }

  // Check-in
  if (booking.checkIn?.timestamp) {
    timeline.push({
      status: 'checkedIn',
      timestamp: booking.checkIn.timestamp,
      event: 'Checked in',
      description: booking.checkIn.isLate
        ? `Late check-in (${booking.checkIn.minutesLate} min late)`
        : 'On-time check-in',
      photos: booking.checkIn.photos
    });
  }

  // Check-out
  if (booking.checkOut?.timestamp) {
    timeline.push({
      status: 'checkedOut',
      timestamp: booking.checkOut.timestamp,
      event: 'Checked out',
      description: 'Parking session completed',
      photos: booking.checkOut.photos
    });
  }

  // Completed
  if (booking.status === 'completed') {
    timeline.push({
      status: 'completed',
      timestamp: booking.updatedAt,
      event: 'Booking completed',
      description: 'Booking finalized and payout processed'
    });
  }

  // Cancelled
  if (booking.status === 'cancelled' && booking.cancelledAt) {
    timeline.push({
      status: 'cancelled',
      timestamp: booking.cancelledAt,
      event: 'Booking cancelled',
      description: booking.cancellationReason || 'Booking cancelled',
      cancelledBy: booking.cancelledBy
    });
  }

  // Disputed
  if (booking.status === 'disputed' && booking.disputeRaisedAt) {
    timeline.push({
      status: 'disputed',
      timestamp: booking.disputeRaisedAt,
      event: 'Dispute raised',
      description: booking.disputeReason || 'Dispute under investigation',
      raisedBy: booking.disputeRaisedBy
    });
  }

  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

module.exports = {
  calculateBookingAmount,
  checkAvailability,
  checkSchedule,
  checkBufferTime,
  calculateRefund,
  validateCheckInTiming,
  validateCheckOutTiming,
  calculateOvertimeCharge,
  canCancelBooking,
  generateBookingTimeline
};
