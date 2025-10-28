const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true
    },
    spotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      index: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee ID is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number'
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      minlength: [10, 'Comment must be at least 10 characters']
    },
    type: {
      type: String,
      enum: {
        values: ['host-review', 'seeker-review', 'spot-review'],
        message: 'Type must be either host-review, seeker-review, or spot-review'
      },
      required: [true, 'Review type is required']
    },
    // Additional rating categories for detailed feedback
    cleanliness: {
      type: Number,
      min: [1, 'Cleanliness rating must be at least 1'],
      max: [5, 'Cleanliness rating cannot exceed 5']
    },
    accessibility: {
      type: Number,
      min: [1, 'Accessibility rating must be at least 1'],
      max: [5, 'Accessibility rating cannot exceed 5']
    },
    security: {
      type: Number,
      min: [1, 'Security rating must be at least 1'],
      max: [5, 'Security rating cannot exceed 5']
    },
    valueForMoney: {
      type: Number,
      min: [1, 'Value for money rating must be at least 1'],
      max: [5, 'Value for money rating cannot exceed 5']
    },
    // Photos can be added to reviews
    photos: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 photos allowed per review'
      },
      default: []
    },
    // Response from reviewee (optional)
    response: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    responseDate: {
      type: Date
    },
    // Flag for inappropriate content
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String,
      trim: true,
      maxlength: [200, 'Flag reason cannot exceed 200 characters']
    },
    // Helpful votes
    helpfulCount: {
      type: Number,
      min: [0, 'Helpful count cannot be negative'],
      default: 0
    },
    // Users who found this review helpful
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isVerified: {
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

// Indexes
reviewSchema.index({ bookingId: 1 }, { unique: true }); // One review per booking
reviewSchema.index({ spotId: 1, rating: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ type: 1, rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Compound index for finding reviews
reviewSchema.index({ revieweeId: 1, type: 1 });
reviewSchema.index({ spotId: 1, type: 1 });

// Virtual for 'id'
reviewSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual to populate booking details
reviewSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate reviewer details
reviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate reviewee details
reviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate spot details
reviewSchema.virtual('spot', {
  ref: 'ParkingSpot',
  localField: 'spotId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to verify the review is from a completed booking
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.bookingId);

    if (!booking) {
      return next(new Error('Booking not found'));
    }

    // Only allow reviews for completed or checked-out bookings
    if (!['checkedOut', 'completed'].includes(booking.status)) {
      return next(new Error('Reviews can only be submitted for completed bookings'));
    }

    // Verify reviewer is part of the booking
    const isSeeker = booking.seekerId.toString() === this.reviewerId.toString();
    const isHost = booking.hostId.toString() === this.reviewerId.toString();

    if (!isSeeker && !isHost) {
      return next(new Error('Only booking participants can submit reviews'));
    }

    // Set spotId for spot reviews
    if (this.type === 'spot-review') {
      this.spotId = booking.spotId;
    }

    // Verify the review type matches the reviewer role
    if (this.type === 'host-review' && !isSeeker) {
      return next(new Error('Only seekers can review hosts'));
    }

    if (this.type === 'seeker-review' && !isHost) {
      return next(new Error('Only hosts can review seekers'));
    }

    // Mark booking as reviewed
    booking.isReviewed = true;
    await booking.save();

    // Set as verified review since it's from an actual booking
    this.isVerified = true;
  }

  next();
});

// Post-save middleware to update parking spot rating
reviewSchema.post('save', async function (doc) {
  if (doc.type === 'spot-review' && doc.spotId) {
    const ParkingSpot = mongoose.model('ParkingSpot');
    const spot = await ParkingSpot.findById(doc.spotId);
    
    if (spot) {
      await spot.updateRating(doc.rating);
    }
  }

  // Update reviewee's trust score
  const User = mongoose.model('User');
  const reviewee = await User.findById(doc.revieweeId);
  
  if (reviewee) {
    // Simple trust score update logic (can be made more sophisticated)
    const ratingImpact = (doc.rating - 3) * 2; // Range: -4 to +4
    reviewee.trustScore = Math.max(0, Math.min(100, reviewee.trustScore + ratingImpact));
    await reviewee.save();
  }
});

// Method to add response to review
reviewSchema.methods.addResponse = function (responseText) {
  this.response = responseText;
  this.responseDate = new Date();
  return this.save();
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function (userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulCount += 1;
  }
  return this.save();
};

// Method to flag review
reviewSchema.methods.flag = function (reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

// Static method to get average rating for a user
reviewSchema.statics.getAverageRating = async function (revieweeId, type = null) {
  const matchStage = { revieweeId: mongoose.Types.ObjectId(revieweeId) };
  
  if (type) {
    matchStage.type = type;
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};

// Static method to get recent reviews
reviewSchema.statics.getRecentReviews = function (revieweeId, limit = 10) {
  return this.find({ revieweeId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('reviewer', 'name profilePhoto')
    .populate('booking', 'startTime endTime');
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
