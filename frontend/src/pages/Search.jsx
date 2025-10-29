import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search';
import { FilterSidebar } from '../components/search';
import { SpotCard, MapView } from '../components/spots';
import { Button } from '../components/common';
import { spotService } from '../services';
import { 
  ViewColumnsIcon, 
  MapIcon, 
  ListBulletIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const VIEW_MODES = {
  SPLIT: 'split',
  MAP_ONLY: 'map',
  LIST_ONLY: 'list'
};

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'distance_asc', label: 'Distance: Nearest First' }
];

const Search = () => {
  const [searchParams] = useSearchParams();
  
  // State management
  const [viewMode, setViewMode] = useState(VIEW_MODES.SPLIT);
  const [showFilters, setShowFilters] = useState(false);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    lat: searchParams.get('lat') || null,
    lng: searchParams.get('lng') || null,
    priceRange: [0, 500],
    spotTypes: [],
    amenities: [],
    startDate: null,
    endDate: null,
    radius: 10,
    sortBy: 'distance_asc',
    page: 1,
    limit: 20
  });

  const [mapCenter, setMapCenter] = useState({
    lat: parseFloat(searchParams.get('lat')) || 28.6139,
    lng: parseFloat(searchParams.get('lng')) || 77.2090
  });

  // Fetch spots based on filters
  const fetchSpots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: filters.limit,
        sortBy: filters.sortBy.split('_')[0],
        sortOrder: filters.sortBy.split('_')[1],
      };

      // Add location-based search
      if (filters.lat && filters.lng) {
        params.lat = filters.lat;
        params.lng = filters.lng;
        params.radius = filters.radius;
      }

      // Add price range
      params.minPrice = filters.priceRange[0];
      params.maxPrice = filters.priceRange[1];

      // Add spot types
      if (filters.spotTypes.length > 0) {
        params.types = filters.spotTypes.join(',');
      }

      // Add amenities
      if (filters.amenities.length > 0) {
        params.amenities = filters.amenities.join(',');
      }

      // Add date range
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await spotService.searchSpots(params);
      
      setSpots(response.data.spots || response.data || []);
      setTotalPages(response.data.totalPages || 1);
      
    } catch (err) {
      console.error('Error fetching spots:', err);
      setError(err.response?.data?.message || 'Failed to fetch parking spots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.limit,
    filters.sortBy,
    filters.lat,
    filters.lng,
    filters.radius,
    filters.priceRange,
    filters.spotTypes,
    filters.amenities,
    filters.startDate,
    filters.endDate,
  ]);

  // Fetch spots when filters change
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Handle location change from search bar
  const handleLocationChange = (location, coordinates) => {
    setFilters(prev => ({
      ...prev,
      location,
      lat: coordinates?.lat || null,
      lng: coordinates?.lng || null
    }));

    if (coordinates) {
      setMapCenter({
        lat: coordinates.lat,
        lng: coordinates.lng
      });
    }

    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setFilters(prev => ({
      ...prev,
      sortBy: e.target.value
    }));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle spot click from map
  const handleSpotClick = (spotId) => {
    const element = document.getElementById(`spot-${spotId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <SearchBar
                initialValue={filters.location}
                onLocationSelect={handleLocationChange}
                placeholder="Search by location, city, or area..."
              />
            </div>

            {/* View Mode Toggles - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setViewMode(VIEW_MODES.SPLIT)}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === VIEW_MODES.SPLIT
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Split View"
              >
                <ViewColumnsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.MAP_ONLY)}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === VIEW_MODES.MAP_ONLY
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Map Only"
              >
                <MapIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.LIST_ONLY)}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === VIEW_MODES.LIST_ONLY
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="List Only"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Filter Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 bg-white shadow-sm h-[calc(100vh-140px)] sticky top-[140px] overflow-y-auto">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Mobile Filter Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
            <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6">
          {/* Results Header */}
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {loading ? 'Searching...' : `${spots.length} Parking Spots`}
              </h1>
              {filters.location && (
                <p className="text-gray-600 mt-1">Near {filters.location}</p>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort"
                value={filters.sortBy}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <Button
                onClick={fetchSpots}
                variant="outline"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-48 h-36 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Based on View Mode */}
          {!loading && !error && (
            <>
              {/* Split View */}
              {viewMode === VIEW_MODES.SPLIT && (
                <div className="space-y-6">
                  {/* Map Section */}
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden h-96">
                    <MapView
                      spots={spots}
                      center={mapCenter}
                      onSpotClick={handleSpotClick}
                    />
                  </div>

                  {/* List Section */}
                  <div>
                    {spots.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {spots.map(spot => (
                          <SpotCard
                            key={spot._id}
                            spot={spot}
                            id={`spot-${spot._id}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Only View */}
              {viewMode === VIEW_MODES.MAP_ONLY && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-250px)]">
                  <MapView
                    spots={spots}
                    center={mapCenter}
                    onSpotClick={handleSpotClick}
                  />
                </div>
              )}

              {/* List Only View */}
              {viewMode === VIEW_MODES.LIST_ONLY && (
                <div>
                  {spots.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {spots.map(spot => (
                        <SpotCard
                          key={spot._id}
                          spot={spot}
                          id={`spot-${spot._id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {spots.length > 0 && totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = () => (
  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
    <div className="max-w-md mx-auto">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MapIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No parking spots found
      </h3>
      <p className="text-gray-600 mb-6">
        Try adjusting your filters or search in a different location.
      </p>
      <Button variant="primary">
        Clear Filters
      </Button>
    </div>
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            currentPage === page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

export default Search;
