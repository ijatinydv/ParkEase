const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ParkingSpot = require('../models/ParkingSpot');
const { updateUserTrustScore, getTrustScoreBreakdown } = require('../utils/trustScoreCalculator');

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      bookingId,
      revieweeId,
      rating,
      comment,
      type,
      cleanliness,
      accessibility,
      security,
      valueForMoney,
      photos
    } = req.body;

    const reviewerId = req.user.id;

    // 1. Verify booking exists and is completed
    const booking = await Booking.findById(bookingId)
      .populate('spotId')
      .populate('hostId')
      .populate('seekerId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed or checked out
    if (!['checkedOut', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed bookings'
      });
    }

    // 2. Verify user is part of the booking
    const isSeeker = booking.seekerId._id.toString() === reviewerId;
    const isHost = booking.hostId._id.toString() === reviewerId;

    if (!isSeeker && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this booking'
      });
    }

    // 3. Verify review type matches reviewer role
    if (type === 'host-review' && !isSeeker) {
      return res.status(400).json({
        success: false,
        message: 'Only seekers can review hosts'
      });
    }

    if (type === 'seeker-review' && !isHost) {
      return res.status(400).json({
        success: false,
        message: 'Only hosts can review seekers'
      });
    }

    // For spot reviews, only seekers can review
    if (type === 'spot-review' && !isSeeker) {
      return res.status(400).json({
        success: false,
        message: 'Only seekers can review parking spots'
      });
    }

    // 4. Check if user already reviewed this booking
    const existingReview = await Review.findOne({
      bookingId,
      reviewerId,
      type
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    // 5. Verify reviewee ID matches the booking
    let spotId = null;
    if (type === 'host-review') {
      if (revieweeId !== booking.hostId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Reviewee must be the host of this booking'
        });
      }
    } else if (type === 'seeker-review') {
      if (revieweeId !== booking.seekerId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Reviewee must be the seeker of this booking'
        });
      }
    } else if (type === 'spot-review') {
      // For spot reviews, reviewee is still the host who owns the spot
      if (revieweeId !== booking.hostId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Reviewee must be the host for spot reviews'
        });
      }
      spotId = booking.spotId._id;
    }

    // 6. Create review
    const review = await Review.create({
      bookingId,
      spotId,
      reviewerId,
      revieweeId,
      rating,
      comment,
      type,
      cleanliness,
      accessibility,
      security,
      valueForMoney,
      photos: photos || [],
      isVerified: true // Verified because it's from an actual booking
    });

    // 7. Update trust score of reviewee
    await updateUserTrustScore(revieweeId);

    // 8. Populate review with details
    await review.populate([
      { path: 'reviewer', select: 'name profilePhoto trustScore' },
      { path: 'reviewee', select: 'name profilePhoto trustScore' },
      { path: 'booking', select: 'startTime endTime vehicleType' }
    ]);

    // If it's a spot review, also populate spot details
    if (type === 'spot-review') {
      await review.populate('spotId', 'name address');
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

/**
 * @desc    Get all reviews for a parking spot
 * @route   GET /api/reviews/spot/:spotId
 * @access  Public
 */
const getSpotReviews = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { spotId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'date';

    // Verify spot exists
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'rating':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'helpful':
        sortCriteria = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'date':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reviews for this spot
    const reviews = await Review.find({
      spotId,
      type: 'spot-review'
    })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name profilePhoto trustScore')
      .populate('booking', 'startTime endTime vehicleType');

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      spotId,
      type: 'spot-review'
    });

    // Calculate average rating and rating distribution
    const ratingStats = await Review.aggregate([
      {
        $match: {
          spotId: spot._id,
          type: 'spot-review'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          averageCleanliness: { $avg: '$cleanliness' },
          averageAccessibility: { $avg: '$accessibility' },
          averageSecurity: { $avg: '$security' },
          averageValueForMoney: { $avg: '$valueForMoney' }
        }
      }
    ]);

    // Get rating distribution (1-5 stars)
    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          spotId: spot._id,
          type: 'spot-review'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Format rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(d => d._id === rating);
      return {
        rating,
        count: found ? found.count : 0,
        percentage: totalReviews > 0 
          ? Math.round((found ? found.count : 0) / totalReviews * 100) 
          : 0
      };
    }).reverse();

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          limit
        },
        statistics: {
          averageRating: ratingStats.length > 0 
            ? Math.round(ratingStats[0].averageRating * 10) / 10 
            : 0,
          totalReviews,
          averageCleanliness: ratingStats.length > 0 
            ? Math.round(ratingStats[0].averageCleanliness * 10) / 10 
            : 0,
          averageAccessibility: ratingStats.length > 0 
            ? Math.round(ratingStats[0].averageAccessibility * 10) / 10 
            : 0,
          averageSecurity: ratingStats.length > 0 
            ? Math.round(ratingStats[0].averageSecurity * 10) / 10 
            : 0,
          averageValueForMoney: ratingStats.length > 0 
            ? Math.round(ratingStats[0].averageValueForMoney * 10) / 10 
            : 0,
          ratingDistribution: distribution
        }
      }
    });
  } catch (error) {
    console.error('Error getting spot reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spot reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews received by a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const type = req.query.type || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query
    const query = { revieweeId: userId };
    
    // Filter by type if specified
    if (type !== 'all') {
      if (!['host-review', 'seeker-review'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid review type. Must be host-review, seeker-review, or all'
        });
      }
      query.type = type;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reviews
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name profilePhoto trustScore')
      .populate('booking', 'startTime endTime vehicleType');

    // Get total count
    const totalReviews = await Review.countDocuments(query);

    // Get reviews by type
    const reviewsByType = await Review.aggregate([
      {
        $match: { revieweeId: user._id }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Calculate overall statistics
    const hostReviews = reviewsByType.find(r => r._id === 'seeker-review') || { count: 0, averageRating: 0 };
    const seekerReviews = reviewsByType.find(r => r._id === 'host-review') || { count: 0, averageRating: 0 };

    // Calculate overall average rating
    const overallStats = await Review.aggregate([
      {
        $match: { revieweeId: user._id }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Get trust score breakdown
    const trustScoreBreakdown = await getTrustScoreBreakdown(user, userId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          limit
        },
        statistics: {
          overall: {
            averageRating: overallStats.length > 0 
              ? Math.round(overallStats[0].averageRating * 10) / 10 
              : 0,
            totalReviews: overallStats.length > 0 ? overallStats[0].totalReviews : 0
          },
          asHost: {
            count: hostReviews.count,
            averageRating: Math.round(hostReviews.averageRating * 10) / 10
          },
          asSeeker: {
            count: seekerReviews.count,
            averageRating: Math.round(seekerReviews.averageRating * 10) / 10
          }
        },
        trustScore: trustScoreBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Update a review (within 24 hours)
 * @route   PUT /api/reviews/:reviewId
 * @access  Private
 */
const updateReview = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify ownership
    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review'
      });
    }

    // Check if review is within 24 hours
    const reviewAge = Date.now() - review.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (reviewAge > twentyFourHours) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be updated within 24 hours of creation'
      });
    }

    // Update allowed fields
    const updateFields = [
      'rating',
      'comment',
      'cleanliness',
      'accessibility',
      'security',
      'valueForMoney',
      'photos'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();

    // Recalculate trust score of reviewee
    await updateUserTrustScore(review.revieweeId);

    // Populate review with details
    await review.populate([
      { path: 'reviewer', select: 'name profilePhoto trustScore' },
      { path: 'reviewee', select: 'name profilePhoto trustScore' },
      { path: 'booking', select: 'startTime endTime vehicleType' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a review (Admin only)
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private/Admin
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Store reviewee ID before deletion
    const revieweeId = review.revieweeId;

    // Delete review
    await review.deleteOne();

    // Recalculate trust scores
    await updateUserTrustScore(revieweeId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single review by ID
 * @route   GET /api/reviews/:reviewId
 * @access  Public
 */
const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('reviewer', 'name profilePhoto trustScore')
      .populate('reviewee', 'name profilePhoto trustScore')
      .populate('booking', 'startTime endTime vehicleType')
      .populate('spotId', 'name address');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review',
      error: error.message
    });
  }
};

/**
 * @desc    Add response to a review (reviewee only)
 * @route   POST /api/reviews/:reviewId/response
 * @access  Private
 */
const addResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify user is the reviewee
    if (review.revieweeId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewee can respond to this review'
      });
    }

    // Add response
    await review.addResponse(response);

    await review.populate([
      { path: 'reviewer', select: 'name profilePhoto trustScore' },
      { path: 'reviewee', select: 'name profilePhoto trustScore' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
};

/**
 * @desc    Mark review as helpful
 * @route   POST /api/reviews/:reviewId/helpful
 * @access  Private
 */
const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    if (review.helpfulBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    await review.markHelpful(userId);

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: review.helpfulCount
      }
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message
    });
  }
};

/**
 * @desc    Flag a review for inappropriate content
 * @route   POST /api/reviews/:reviewId/flag
 * @access  Private
 */
const flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.flag(reason);

    res.status(200).json({
      success: true,
      message: 'Review flagged successfully'
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag review',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getSpotReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewById,
  addResponse,
  markHelpful,
  flagReview
};
