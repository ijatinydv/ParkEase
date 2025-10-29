import { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Button } from '../common';

/**
 * SPOT_TYPES - Available parking spot types
 */
const SPOT_TYPES = [
  { id: 'covered', label: 'Covered Parking' },
  { id: 'open', label: 'Open Parking' },
  { id: 'street', label: 'Street Parking' },
  { id: 'garage', label: 'Garage' },
  { id: 'valet', label: 'Valet Parking' },
];

/**
 * AMENITIES - Available amenities
 */
const AMENITIES = [
  { id: 'cctv', label: 'CCTV Surveillance', icon: '📹' },
  { id: 'security', label: '24/7 Security', icon: '🔒' },
  { id: 'ev_charging', label: 'EV Charging', icon: '🔌' },
  { id: 'lighting', label: 'Well Lit', icon: '💡' },
  { id: 'covered', label: 'Covered', icon: '🏠' },
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿' },
  { id: 'restroom', label: 'Restroom', icon: '🚻' },
  { id: 'car_wash', label: 'Car Wash', icon: '🚿' },
];

/**
 * FilterSidebar Component
 * Comprehensive filter sidebar for searching parking spots
 */
const FilterSidebar = ({ filters, onFilterChange, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    type: true,
    amenities: true,
    date: true,
    distance: true,
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle price range change
  const handlePriceChange = (index, value) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(value, 10);
    onFilterChange({ priceRange: newRange });
  };

  // Handle spot type toggle
  const handleSpotTypeToggle = (typeId) => {
    const newTypes = filters.spotTypes.includes(typeId)
      ? filters.spotTypes.filter(t => t !== typeId)
      : [...filters.spotTypes, typeId];
    onFilterChange({ spotTypes: newTypes });
  };

  // Handle amenity toggle
  const handleAmenityToggle = (amenityId) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(a => a !== amenityId)
      : [...filters.amenities, amenityId];
    onFilterChange({ amenities: newAmenities });
  };

  // Handle date change
  const handleDateChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  // Handle distance change
  const handleDistanceChange = (value) => {
    onFilterChange({ radius: parseInt(value, 10) });
  };

  // Reset all filters
  const handleReset = () => {
    onFilterChange({
      priceRange: [0, 500],
      spotTypes: [],
      amenities: [],
      startDate: null,
      endDate: null,
      radius: 10,
    });
  };

  // Count active filters
  const activeFiltersCount = 
    (filters.spotTypes.length > 0 ? 1 : 0) +
    (filters.amenities.length > 0 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 500 ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0) +
    (filters.radius !== 10 ? 1 : 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        {/* Price Range Filter */}
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection('price')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                ₹{filters.priceRange[0]}
              </span>
              <span className="text-gray-500">to</span>
              <span className="font-medium text-gray-700">
                ₹{filters.priceRange[1]}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-gray-600">Min Price</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-600">Max Price</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </label>
            </div>
          </div>
        </FilterSection>

        {/* Spot Type Filter */}
        <FilterSection
          title="Parking Type"
          isExpanded={expandedSections.type}
          onToggle={() => toggleSection('type')}
        >
          <div className="space-y-2">
            {SPOT_TYPES.map(type => (
              <label
                key={type.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.spotTypes.includes(type.id)}
                  onChange={() => handleSpotTypeToggle(type.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Amenities Filter */}
        <FilterSection
          title="Amenities"
          isExpanded={expandedSections.amenities}
          onToggle={() => toggleSection('amenities')}
        >
          <div className="space-y-2">
            {AMENITIES.map(amenity => (
              <label
                key={amenity.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityToggle(amenity.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-lg">{amenity.icon}</span>
                <span className="text-sm text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Date Range Filter */}
        <FilterSection
          title="Date & Time"
          isExpanded={expandedSections.date}
          onToggle={() => toggleSection('date')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                min={filters.startDate || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {filters.startDate && filters.endDate && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  Duration: {calculateDuration(filters.startDate, filters.endDate)}
                </p>
              </div>
            )}
          </div>
        </FilterSection>

        {/* Distance Filter */}
        <FilterSection
          title="Distance Radius"
          isExpanded={expandedSections.distance}
          onToggle={() => toggleSection('distance')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Within {filters.radius} km
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={filters.radius}
              onChange={(e) => handleDistanceChange(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>
        </FilterSection>
      </div>

      {/* Mobile Apply Button */}
      {onClose && (
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * FilterSection Component
 * Collapsible section for filter categories
 */
const FilterSection = ({ title, children, isExpanded, onToggle }) => {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Calculate duration between two dates
 */
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
};

FilterSidebar.propTypes = {
  filters: PropTypes.shape({
    priceRange: PropTypes.arrayOf(PropTypes.number).isRequired,
    spotTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    amenities: PropTypes.arrayOf(PropTypes.string).isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    radius: PropTypes.number.isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default FilterSidebar;
