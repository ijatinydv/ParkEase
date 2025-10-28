const mongoose = require('mongoose');

// Embedded check-in/check-out schema
const checkInOutSchema = new mongoose.Schema(
  {
    photos: {
      type: [String],
      default: []
    },
    timestamp: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    spotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: [true, 'Parking spot ID is required'],
      index: true
    },
    seekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seeker ID is required'],
      index: true
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Start time must be in the future'
      }
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (v) {
          return v > this.startTime;
        },
        message: 'End time must be after start time'
      }
    },
    duration: {
      type: Number, // in hours
      required: true
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
        'Please provide a valid vehicle number'
      ]
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['car', 'bike', 'bicycle', 'suv', 'truck'],
        message: 'Invalid vehicle type'
      },
      required: [true, 'Vehicle type is required']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    platformFee: {
      type: Number,
      required: [true, 'Platform fee is required'],
      min: [0, 'Platform fee cannot be negative'],
      default: 0
    },
    hostEarnings: {
      type: Number,
      required: [true, 'Host earnings is required'],
      min: [0, 'Host earnings cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'checkedIn',
          'checkedOut',
          'cancelled',
          'disputed',
          'completed'
        ],
        message: 'Invalid booking status'
      },
      default: 'pending',
      index: true
    },
    checkIn: {
      type: checkInOutSchema,
      default: {}
    },
    checkOut: {
      type: checkInOutSchema,
      default: {}
    },
    paymentId: {
      type: String,
      trim: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: {
      type: Date
    },
    disputeReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Dispute reason cannot exceed 1000 characters']
    },
    disputeRaisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputeRaisedAt: {
      type: Date
    },
    disputeResolution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Dispute resolution cannot exceed 1000 characters']
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes
bookingSchema.index({ spotId: 1, status: 1 });
bookingSchema.index({ seekerId: 1, status: 1 });
bookingSchema.index({ hostId: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentId: 1 });

// Ensure no overlapping bookings for the same spot
bookingSchema.index(
  { spotId: 1, startTime: 1, endTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['confirmed', 'checkedIn', 'pending'] }
    }
  }
);

// Virtual for 'id'
bookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual to populate spot details
bookingSchema.virtual('spot', {
  ref: 'ParkingSpot',
  localField: 'spotId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate seeker details
bookingSchema.virtual('seeker', {
  ref: 'User',
  localField: 'seekerId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate host details
bookingSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate duration and amounts
bookingSchema.pre('save', function (next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    // Calculate duration in hours
    const durationMs = this.endTime - this.startTime;
    this.duration = Math.ceil(durationMs / (1000 * 60 * 60));
  }

  // Calculate platform fee (e.g., 10% of total amount)
  if (this.isModified('totalAmount')) {
    const platformFeePercentage = process.env.PLATFORM_FEE_PERCENTAGE || 10;
    this.platformFee = (this.totalAmount * platformFeePercentage) / 100;
    this.hostEarnings = this.totalAmount - this.platformFee;
  }

  next();
});

// Method to check in
bookingSchema.methods.checkIn = function (photos = [], notes = '') {
  this.status = 'checkedIn';
  this.checkIn = {
    photos,
    timestamp: new Date(),
    notes
  };
  return this.save();
};

// Method to check out
bookingSchema.methods.checkOut = function (photos = [], notes = '') {
  this.status = 'checkedOut';
  this.checkOut = {
    photos,
    timestamp: new Date(),
    notes
  };
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = function (userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to raise dispute
bookingSchema.methods.raiseDispute = function (userId, reason) {
  this.status = 'disputed';
  this.disputeRaisedBy = userId;
  this.disputeRaisedAt = new Date();
  this.disputeReason = reason;
  return this.save();
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const hoursUntilStart = (this.startTime - now) / (1000 * 60 * 60);
  
  // Can cancel if booking hasn't started and is at least 2 hours away
  return (
    ['pending', 'confirmed'].includes(this.status) &&
    hoursUntilStart >= 2
  );
};

// Static method to find conflicting bookings
bookingSchema.statics.findConflicting = function (spotId, startTime, endTime, excludeBookingId = null) {
  const query = {
    spotId,
    status: { $in: ['pending', 'confirmed', 'checkedIn'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return this.find(query);
};

// Static method to get earnings for a host
bookingSchema.statics.getHostEarnings = function (hostId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        hostId: mongoose.Types.ObjectId(hostId),
        status: { $in: ['checkedOut', 'completed'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$hostEarnings' },
        totalBookings: { $sum: 1 }
      }
    }
  ]);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
