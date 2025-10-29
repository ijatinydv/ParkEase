/**
 * Trust Score Calculator Utility
 * 
 * Calculates a user's trust score based on multiple weighted factors.
 * Score range: 0-100
 * 
 * FORMULA BREAKDOWN:
 * ==================
 * 
 * 1. AVERAGE RATING (40% weight)
 *    - Based on reviews received as both host and seeker
 *    - Converted to 0-100 scale (1-5 stars → 0-100)
 *    - Formula: (avgRating / 5) * 100 * 0.40
 * 
 * 2. TOTAL REVIEWS (20% weight)
 *    - More reviews indicate more experience and reliability
 *    - Logarithmic scale to prevent outlier dominance
 *    - Formula: min(100, (log10(totalReviews + 1) / log10(101)) * 100) * 0.20
 *    - Caps at 100 reviews for maximum score
 * 
 * 3. COMPLETION RATE (20% weight)
 *    - Percentage of bookings completed successfully
 *    - Formula: (completedBookings / totalBookings) * 100 * 0.20
 *    - Considers bookings where user didn't cancel
 * 
 * 4. ACCOUNT AGE (10% weight)
 *    - Older accounts are generally more trustworthy
 *    - Maxes out at 2 years (730 days)
 *    - Formula: min(100, (accountAgeDays / 730) * 100) * 0.10
 * 
 * 5. VERIFICATION STATUS (10% weight)
 *    - Aadhar verification adds credibility
 *    - Binary: 100 if verified, 0 if not
 *    - Formula: (isVerified ? 100 : 0) * 0.10
 * 
 * TOTAL SCORE = Sum of all weighted components
 * 
 * Example Calculation:
 * - Avg Rating: 4.5/5 → (4.5/5)*100*0.40 = 36 points
 * - Total Reviews: 25 → (log10(26)/log10(101))*100*0.20 = 14.2 points
 * - Completion Rate: 90% → 90*0.20 = 18 points
 * - Account Age: 365 days → (365/730)*100*0.10 = 5 points
 * - Verified: Yes → 100*0.10 = 10 points
 * TOTAL = 83.2 points
 */

const Review = require('../models/Review');
const Booking = require('../models/Booking');

/**
 * Calculate user trust score based on multiple factors
 * @param {Object} user - User object with basic information
 * @param {mongoose.Types.ObjectId} userId - User's MongoDB ID
 * @returns {Promise<number>} Trust score (0-100)
 */
async function calculateTrustScore(user, userId) {
  try {
    // Initialize score components
    let ratingScore = 0;
    let reviewCountScore = 0;
    let completionRateScore = 0;
    let accountAgeScore = 0;
    let verificationScore = 0;

    // 1. AVERAGE RATING SCORE (40% weight)
    const reviewStats = await getReviewStatistics(userId);
    if (reviewStats.totalReviews > 0) {
      // Convert 1-5 rating to 0-100 scale
      const ratingPercentage = (reviewStats.averageRating / 5) * 100;
      ratingScore = ratingPercentage * 0.40;
    } else {
      // New users start with neutral rating score (50% of max = 20 points)
      ratingScore = 50 * 0.40;
    }

    // 2. TOTAL REVIEWS SCORE (20% weight)
    // Logarithmic scale: encourages getting reviews but with diminishing returns
    // log10(101) ≈ 2.004, so 100 reviews gives max score
    if (reviewStats.totalReviews > 0) {
      const reviewCountPercentage = 
        Math.min(100, (Math.log10(reviewStats.totalReviews + 1) / Math.log10(101)) * 100);
      reviewCountScore = reviewCountPercentage * 0.20;
    }

    // 3. COMPLETION RATE SCORE (20% weight)
    const bookingStats = await getBookingStatistics(userId);
    if (bookingStats.totalBookings > 0) {
      const completionPercentage = 
        (bookingStats.completedBookings / bookingStats.totalBookings) * 100;
      completionRateScore = completionPercentage * 0.20;
    } else {
      // New users with no bookings get neutral score (70% of max = 14 points)
      completionRateScore = 70 * 0.20;
    }

    // 4. ACCOUNT AGE SCORE (10% weight)
    const accountAgeDays = getAccountAgeDays(user.createdAt);
    // Max out at 2 years (730 days)
    const agePercentage = Math.min(100, (accountAgeDays / 730) * 100);
    accountAgeScore = agePercentage * 0.10;

    // 5. VERIFICATION STATUS SCORE (10% weight)
    const isVerified = user.aadharVerified || false;
    verificationScore = (isVerified ? 100 : 0) * 0.10;

    // Calculate total score
    const totalScore = 
      ratingScore + 
      reviewCountScore + 
      completionRateScore + 
      accountAgeScore + 
      verificationScore;

    // Ensure score is within bounds (0-100) and round to 1 decimal place
    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore * 10) / 10));

    return finalScore;
  } catch (error) {
    console.error('Error calculating trust score:', error);
    // Return default score on error
    return 50;
  }
}

/**
 * Get review statistics for a user
 * @param {mongoose.Types.ObjectId} userId - User's ID
 * @returns {Promise<Object>} Review statistics
 */
async function getReviewStatistics(userId) {
  try {
    const reviews = await Review.find({ revieweeId: userId });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        hostReviews: 0,
        seekerReviews: 0
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Count by type
    const hostReviews = reviews.filter(r => r.type === 'seeker-review').length;
    const seekerReviews = reviews.filter(r => r.type === 'host-review').length;

    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimals
      totalReviews: reviews.length,
      hostReviews,
      seekerReviews
    };
  } catch (error) {
    console.error('Error getting review statistics:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      hostReviews: 0,
      seekerReviews: 0
    };
  }
}

/**
 * Get booking statistics for a user (as both host and seeker)
 * @param {mongoose.Types.ObjectId} userId - User's ID
 * @returns {Promise<Object>} Booking statistics
 */
async function getBookingStatistics(userId) {
  try {
    // Get bookings where user is either host or seeker
    const allBookings = await Booking.find({
      $or: [{ hostId: userId }, { seekerId: userId }]
    });

    const totalBookings = allBookings.length;

    // Count completed bookings (checkedOut or completed status)
    const completedBookings = allBookings.filter(
      booking => ['checkedOut', 'completed'].includes(booking.status)
    ).length;

    // Count cancelled by this user
    const cancelledByUser = allBookings.filter(
      booking => booking.status === 'cancelled' && 
                 booking.cancelledBy && 
                 booking.cancelledBy.toString() === userId.toString()
    ).length;

    // Calculate completion rate (excluding cancellations by user)
    const eligibleBookings = totalBookings - cancelledByUser;
    const completionRate = eligibleBookings > 0 
      ? (completedBookings / eligibleBookings) * 100 
      : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledByUser,
      completionRate: Math.round(completionRate * 100) / 100
    };
  } catch (error) {
    console.error('Error getting booking statistics:', error);
    return {
      totalBookings: 0,
      completedBookings: 0,
      cancelledByUser: 0,
      completionRate: 0
    };
  }
}

/**
 * Calculate account age in days
 * @param {Date} createdAt - Account creation date
 * @returns {number} Account age in days
 */
function getAccountAgeDays(createdAt) {
  if (!createdAt) return 0;
  
  const now = new Date();
  const accountCreated = new Date(createdAt);
  const diffTime = Math.abs(now - accountCreated);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get detailed trust score breakdown for display
 * @param {Object} user - User object
 * @param {mongoose.Types.ObjectId} userId - User's ID
 * @returns {Promise<Object>} Detailed score breakdown
 */
async function getTrustScoreBreakdown(user, userId) {
  try {
    const reviewStats = await getReviewStatistics(userId);
    const bookingStats = await getBookingStatistics(userId);
    const accountAgeDays = getAccountAgeDays(user.createdAt);
    const isVerified = user.aadharVerified || false;

    // Calculate individual components
    const ratingPercentage = reviewStats.totalReviews > 0 
      ? (reviewStats.averageRating / 5) * 100 
      : 50;
    const ratingScore = ratingPercentage * 0.40;

    const reviewCountPercentage = reviewStats.totalReviews > 0
      ? Math.min(100, (Math.log10(reviewStats.totalReviews + 1) / Math.log10(101)) * 100)
      : 0;
    const reviewCountScore = reviewCountPercentage * 0.20;

    const completionPercentage = bookingStats.totalBookings > 0
      ? (bookingStats.completedBookings / bookingStats.totalBookings) * 100
      : 70;
    const completionRateScore = completionPercentage * 0.20;

    const agePercentage = Math.min(100, (accountAgeDays / 730) * 100);
    const accountAgeScore = agePercentage * 0.10;

    const verificationScore = (isVerified ? 100 : 0) * 0.10;

    const totalScore = 
      ratingScore + 
      reviewCountScore + 
      completionRateScore + 
      accountAgeScore + 
      verificationScore;

    return {
      totalScore: Math.max(0, Math.min(100, Math.round(totalScore * 10) / 10)),
      breakdown: {
        rating: {
          score: Math.round(ratingScore * 10) / 10,
          weight: '40%',
          details: {
            averageRating: reviewStats.averageRating,
            totalReviews: reviewStats.totalReviews
          }
        },
        reviewCount: {
          score: Math.round(reviewCountScore * 10) / 10,
          weight: '20%',
          details: {
            totalReviews: reviewStats.totalReviews,
            asHost: reviewStats.hostReviews,
            asSeeker: reviewStats.seekerReviews
          }
        },
        completionRate: {
          score: Math.round(completionRateScore * 10) / 10,
          weight: '20%',
          details: {
            completionRate: bookingStats.completionRate,
            completedBookings: bookingStats.completedBookings,
            totalBookings: bookingStats.totalBookings
          }
        },
        accountAge: {
          score: Math.round(accountAgeScore * 10) / 10,
          weight: '10%',
          details: {
            days: accountAgeDays,
            percentage: Math.round(agePercentage * 10) / 10
          }
        },
        verification: {
          score: Math.round(verificationScore * 10) / 10,
          weight: '10%',
          details: {
            isVerified,
            aadharVerified: isVerified
          }
        }
      }
    };
  } catch (error) {
    console.error('Error getting trust score breakdown:', error);
    throw error;
  }
}

/**
 * Recalculate and update user's trust score in database
 * @param {mongoose.Types.ObjectId} userId - User's ID
 * @returns {Promise<number>} Updated trust score
 */
async function updateUserTrustScore(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const newTrustScore = await calculateTrustScore(user, userId);
    
    // Update user's trust score
    user.trustScore = newTrustScore;
    await user.save();

    return newTrustScore;
  } catch (error) {
    console.error('Error updating user trust score:', error);
    throw error;
  }
}

module.exports = {
  calculateTrustScore,
  getTrustScoreBreakdown,
  updateUserTrustScore,
  getReviewStatistics,
  getBookingStatistics,
  getAccountAgeDays
};
