import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  MapPinIcon, 
  StarIcon, 
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

/**
 * AMENITY_ICONS - Icons for different amenities
 */
const AMENITY_ICONS = {
  cctv: '📹',
  security: '🔒',
  ev_charging: '🔌',
  lighting: '💡',
  covered: '🏠',
  wheelchair: '♿',
  restroom: '🚻',
  car_wash: '🚿',
};

/**
 * SpotCard Component
 * Displays parking spot information in a card format with image carousel
 */
const SpotCard = ({ spot, id }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Extract spot data with defaults
  const {
    _id,
    title = 'Parking Spot',
    location = {},
    images = [],
    pricePerHour = 0,
    rating = 0,
    reviews = [],
    amenities = [],
    spotType = 'covered',
    availability = {},
    distance,
  } = spot;

  const displayImages = images.length > 0 
    ? images 
    : ['/assets/placeholder-parking.jpg'];

  // Handle image navigation
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  // Handle favorite toggle
  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Implement API call to save/remove favorite
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Format address
  const formatAddress = () => {
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    return parts.join(', ') || 'Location not specified';
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : rating || 0;

  // Get availability status
  const isAvailable = availability.isAvailable !== false;

  return (
    <Link
      to={`/spots/${_id}`}
      id={id}
      className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Carousel Section */}
        <div className="relative w-full sm:w-80 h-56 sm:h-auto flex-shrink-0 bg-gray-200">
          {/* Main Image */}
          <img
            src={imageError ? '/assets/placeholder-parking.jpg' : displayImages[currentImageIndex]}
            alt={`${title} - Image ${currentImageIndex + 1}`}
            onError={handleImageError}
            className="w-full h-full object-cover"
          />

          {/* Image Navigation */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-800" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-700" />
            )}
          </button>

          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isAvailable 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>

          {/* Spot Type Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium capitalize">
              {spotType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-5">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {title}
                </h3>
                
                {/* Rating */}
                {averageRating > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {averageRating}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 mb-3 text-gray-600">
                <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm line-clamp-1">{formatAddress()}</p>
                  {distance && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {distance.toFixed(1)} km away
                    </p>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {amenities.slice(0, 6).map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                      title={amenity}
                    >
                      <span>{AMENITY_ICONS[amenity] || '✓'}</span>
                      <span className="hidden sm:inline capitalize">
                        {amenity.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {amenities.length > 6 && (
                    <div className="flex items-center px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                      +{amenities.length - 6} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {/* Price */}
              <div className="flex items-center gap-2">
                <div className="flex items-baseline">
                  <CurrencyRupeeIcon className="w-5 h-5 text-gray-700" />
                  <span className="text-2xl font-bold text-gray-900">
                    {pricePerHour}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>
              </div>

              {/* View Details Button */}
              <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

SpotCard.propTypes = {
  spot: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      city: PropTypes.string,
      coordinates: PropTypes.arrayOf(PropTypes.number),
    }),
    images: PropTypes.arrayOf(PropTypes.string),
    pricePerHour: PropTypes.number,
    rating: PropTypes.number,
    reviews: PropTypes.arrayOf(PropTypes.object),
    amenities: PropTypes.arrayOf(PropTypes.string),
    spotType: PropTypes.string,
    availability: PropTypes.shape({
      isAvailable: PropTypes.bool,
    }),
    distance: PropTypes.number,
  }).isRequired,
  id: PropTypes.string,
};

export default SpotCard;
