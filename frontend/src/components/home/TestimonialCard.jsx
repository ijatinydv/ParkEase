import PropTypes from 'prop-types';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

/**
 * TestimonialCard Component
 * Displays user testimonials with photo, name, role, rating, and quote
 */
const TestimonialCard = ({ 
  user,
  className = ''
}) => {
  const {
    name = 'Anonymous User',
    photo = null,
    role = 'User',
    rating = 5,
    quote = 'Great experience!',
    location = '',
  } = user;

  /**
   * Render star rating
   */
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <StarIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarOutlineIcon className="w-5 h-5 text-gray-300" />
          )}
        </span>
      );
    }
    return stars;
  };

  /**
   * Get initials from name for placeholder avatar
   */
  const getInitials = (name) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className={`
        relative bg-white p-6 sm:p-8 rounded-2xl shadow-md 
        hover:shadow-xl transition-all duration-300 
        border-2 border-gray-100 hover:border-blue-200
        group h-full flex flex-col
        ${className}
      `}
    >
      {/* Quote Icon Background */}
      <div className="absolute top-6 right-6 text-8xl text-gray-100 font-serif leading-none select-none opacity-50 group-hover:text-blue-100 transition-colors duration-300">
        &ldquo;
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Rating Stars */}
        <div className="flex items-center gap-1 mb-4">
          {renderStars()}
        </div>

        {/* Quote Text */}
        <blockquote className="flex-1 mb-6">
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic">
            &ldquo;{quote}&rdquo;
          </p>
        </blockquote>

        {/* User Info */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          {/* User Photo/Avatar */}
          <div className="flex-shrink-0">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 group-hover:border-blue-400 transition-colors duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`
                ${photo ? 'hidden' : 'flex'} 
                w-14 h-14 rounded-full 
                bg-gradient-to-br from-blue-400 to-blue-600 
                items-center justify-center 
                text-white font-bold text-lg
                border-2 border-blue-200 
                group-hover:border-blue-400 
                transition-colors duration-300
              `}
            >
              {getInitials(name)}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors duration-300">
              {name}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium capitalize">{role}</span>
              {location && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="truncate">{location}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verified Badge (Optional) */}
      {rating === 5 && (
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          <StarIcon className="w-3 h-3" />
          <span>Top Review</span>
        </div>
      )}

      {/* Hover Gradient Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

TestimonialCard.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    photo: PropTypes.string,
    role: PropTypes.oneOf(['Seeker', 'Host', 'User', 'seeker', 'host', 'user']),
    rating: PropTypes.number,
    quote: PropTypes.string,
    location: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
};

export default TestimonialCard;
