import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

/**
 * Star Rating Component
 */
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= rating ? (
            <StarIcon className="w-4 h-4 text-yellow-500" />
          ) : (
            <StarOutline className="w-4 h-4 text-neutral-300" />
          )}
        </span>
      ))}
    </div>
  );
};

/**
 * Single Review Component
 */
const ReviewItem = ({ review, index }) => {
  const {
    user,
    rating,
    comment,
    createdAt,
    images = [],
  } = review;

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMMM yyyy');
    } catch {
      return 'Recently';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="pb-6 border-b border-neutral-200 last:border-0"
    >
      {/* User info */}
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900">
            {user?.name || 'Anonymous User'}
          </h4>
          <p className="text-sm text-neutral-600">{formatDate(createdAt)}</p>
        </div>

        <div className="flex-shrink-0">
          <StarRating rating={rating} />
        </div>
      </div>

      {/* Review comment */}
      {comment && (
        <p className="text-neutral-700 leading-relaxed mb-3">{comment}</p>
      )}

      {/* Review images */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`Review image ${idx + 1}`}
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * ReviewsList Component
 * Displays all reviews for a parking spot
 */
const ReviewsList = ({ reviews = [], averageRating = 0, totalReviews = 0 }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <StarOutline className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          No reviews yet
        </h3>
        <p className="text-neutral-600">
          Be the first to review this parking spot!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews header */}
      <div className="flex items-center gap-3">
        <StarIcon className="w-6 h-6 text-yellow-500" />
        <h3 className="text-2xl font-bold text-neutral-900">
          {averageRating.toFixed(1)}
        </h3>
        <span className="text-neutral-600">
          · {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Rating breakdown (optional - if you have breakdown data) */}
      <div className="grid grid-cols-1 gap-2">
        {/* This would show distribution of ratings if available */}
      </div>

      {/* Reviews list */}
      <div className="space-y-6 mt-8">
        {reviews.map((review, index) => (
          <ReviewItem key={review._id || index} review={review} index={index} />
        ))}
      </div>

      {/* Show more button (if needed) */}
      {reviews.length >= 5 && (
        <button className="w-full mt-6 py-3 border-2 border-neutral-900 rounded-lg font-semibold hover:bg-neutral-50 transition-colors">
          Show All {totalReviews} Reviews
        </button>
      )}
    </div>
  );
};

export default ReviewsList;
