import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

/**
 * HeroSection Component
 * Main hero section with search, CTA, and trust indicators
 */
const HeroSection = ({ 
  title = "Find Parking in Seconds", 
  subtitle = "Discover and book verified parking spots near you. Save time, money, and stress.",
  showSearch = true,
  stats = [
    { label: 'Parking Spots', value: '10,000+', icon: BuildingOfficeIcon },
    { label: 'Happy Users', value: '50,000+', icon: UserGroupIcon },
    { label: 'Verified Hosts', value: '5,000+', icon: CheckBadgeIcon },
  ]
}) => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');

  /**
   * Handle search submission
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      navigate(`/search?location=${encodeURIComponent(searchLocation)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 animate-fade-in-up">
            {title}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            {subtitle}
          </p>

          {/* Search Bar */}
          {showSearch && (
            <div className="max-w-3xl mx-auto mb-12 animate-fade-in-up animation-delay-400">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow duration-300">
                  {/* Location Icon */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPinIcon className="w-6 h-6" />
                  </div>

                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Enter your location (e.g., Connaught Place, Delhi)"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1 pl-16 pr-4 py-5 sm:py-6 text-base sm:text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
                    aria-label="Search location"
                  />

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 sm:px-8 py-5 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-300 flex-shrink-0"
                    aria-label="Search parking"
                  >
                    <MagnifyingGlassIcon className="w-6 h-6" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>

                {/* Quick Search Suggestions */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="text-blue-200">Popular:</span>
                  {['Delhi', 'Mumbai', 'Bangalore', 'Pune'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSearchLocation(city);
                        navigate(`/search?location=${encodeURIComponent(city)}`);
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-200"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          )}

          {/* Trust Indicators / Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mt-12 animate-fade-in-up animation-delay-600">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                >
                  <div className="mb-3">
                    <Icon className="w-10 h-10 text-blue-200" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-blue-200 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fade-in-up animation-delay-800">
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
            >
              Browse All Spots
            </button>
            <button
              onClick={() => navigate('/my-spots/new')}
              className="px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white hover:bg-white/10 transition-all duration-300 w-full sm:w-auto"
            >
              List Your Spot
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 sm:h-16 md:h-20 text-white"
          preserveAspectRatio="none"
          viewBox="0 0 1440 74"
          fill="currentColor"
        >
          <path d="M0,0 C240,74 480,74 720,37 C960,0 1200,0 1440,37 L1440,74 L0,74 Z" />
        </svg>
      </div>
    </section>
  );
};

HeroSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showSearch: PropTypes.bool,
  stats: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  })),
};

export default HeroSection;
