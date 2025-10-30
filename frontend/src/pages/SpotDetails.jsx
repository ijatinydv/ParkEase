import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  StarIcon,
  ShareIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import spotService from '@services/spotService';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '@components/common/Spinner';
import Button from '@components/common/Button';
import PhotoGallery from '@components/spots/PhotoGallery';
import BookingWidget from '@components/bookings/BookingWidget';
import BookingModal from '@components/bookings/BookingModal';
import HostCard from '@components/user/HostCard';
import AmenitiesList from '@components/spots/AmenitiesList';
import LocationMap from '@components/map/LocationMap';
import ReviewsList from '@components/review/ReviewsList';
import SpotCard from '@components/spots/SpotCard';

/**
 * SpotDetails Page
 * Displays comprehensive parking spot information
 */
const SpotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [spot, setSpot] = useState(null);
  const [similarSpots, setSimilarSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const fetchSpotDetails = async () => {
      setIsLoading(true);
      try {
        const response = await spotService.getSpotById(id);
        setSpot(response.spot || response);
      } catch (error) {
        console.error('Error fetching spot:', error);
        toast.error('Failed to load parking spot details');
        navigate('/search');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpotDetails();
  }, [id, navigate]);

  useEffect(() => {
    const fetchSimilarSpots = async () => {
      try {
        if (spot?.location?.coordinates) {
          const [lng, lat] = spot.location.coordinates;
          const response = await spotService.getNearbySpots(lat, lng, 3, {
            limit: 4,
          });
          const filtered = (response.spots || []).filter(s => s._id !== spot._id);
          setSimilarSpots(filtered.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching similar spots:', error);
      }
    };

    if (spot) {
      fetchSimilarSpots();
    }
  }, [spot]);

  const handleBookNow = (data) => {
    if (!isAuthenticated) {
      toast.error('Please login to book this spot');
      navigate('/login', { state: { from: `/parking/${id}` } });
      return;
    }

    setBookingData(data);
    setIsBookingModalOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: spot.title,
          text: `Check out this parking spot: ${spot.title}`,
          url: url,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      navigate('/login');
      return;
    }
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleContactHost = () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact the host');
      navigate('/login');
      return;
    }
    toast.info('Contact feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <MapPinIcon className="w-16 h-16 text-neutral-400 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Spot Not Found
        </h2>
        <p className="text-neutral-600 mb-6">
          The parking spot you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => navigate('/search')}>
          Browse Parking Spots
        </Button>
      </div>
    );
  }

  const {
    title,
    description,
    images = [],
    pricePerHour,
    address,
    location,
    amenities = [],
    availableSpots = 1,
    vehicleTypes = [],
    owner,
    reviews = [],
    averageRating = 0,
  } = spot;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header actions */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              ← Back
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              
              <button
                onClick={toggleFavorite}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                {isFavorite ? (
                  <HeartSolid className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Photo Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PhotoGallery images={images} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-neutral-900 mb-3">
                {title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span>({reviews.length} reviews)</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{address}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 bg-white rounded-xl border border-neutral-200"
            >
              <div>
                <p className="text-sm text-neutral-600 mb-1">Price</p>
                <p className="text-xl font-bold text-neutral-900">
                  ₹{pricePerHour}/hr
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-600 mb-1">Available Spots</p>
                <p className="text-xl font-bold text-neutral-900">
                  {availableSpots}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-600 mb-1">Vehicle Types</p>
                <p className="text-sm font-medium text-neutral-900">
                  {vehicleTypes.join(', ') || 'All types'}
                </p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-neutral-200 p-6"
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                About This Space
              </h2>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {description || 'No description available.'}
              </p>
            </motion.div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl border border-neutral-200 p-6"
              >
                <AmenitiesList amenities={amenities} />
              </motion.div>
            )}

            {/* Location Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-neutral-200 p-6"
            >
              <LocationMap
                location={location}
                address={address}
                spotName={title}
              />
            </motion.div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-xl border border-neutral-200 p-6"
              >
                <ReviewsList
                  reviews={reviews}
                  averageRating={averageRating}
                  totalReviews={reviews.length}
                />
              </motion.div>
            )}
          </div>

          {/* Right column - Booking widget and host card */}
          <div className="lg:col-span-1 space-y-6">
            <BookingWidget spot={spot} onBookNow={handleBookNow} />
            {owner && (
              <HostCard host={owner} onContact={handleContactHost} />
            )}
          </div>
        </div>

        {/* Similar spots */}
        {similarSpots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Similar Parking Spots Nearby
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarSpots.map((similarSpot) => (
                <SpotCard key={similarSpot._id} spot={similarSpot} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingData={bookingData}
        spot={spot}
        user={user}
      />
    </div>
  );
};

export default SpotDetails;
