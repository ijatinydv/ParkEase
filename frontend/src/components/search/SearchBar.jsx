import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchBar component with Google Places Autocomplete
 * Allows users to search for locations with autocomplete suggestions
 */
const SearchBar = ({ initialValue = '', onLocationSelect, placeholder = 'Search location...' }) => {
  const [searchInput, setSearchInput] = useState(initialValue);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
    } else {
      console.warn('Google Maps API not loaded. Autocomplete will not work.');
    }
  }, []);

  // Handle click outside to close predictions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch predictions from Google Places API
  const fetchPredictions = (input) => {
    if (!input.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input,
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'in' }, // Restrict to India, change as needed
    };

    autocompleteService.current.getPlacePredictions(request, (results, status) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
      }
    });
  };

  // Get place details from place_id
  const getPlaceDetails = (placeId, description) => {
    if (!placesService.current) {
      // Fallback if Google Maps is not available
      onLocationSelect(description, null);
      return;
    }

    const request = {
      placeId,
      fields: ['geometry', 'formatted_address', 'name'],
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        
        onLocationSelect(description, coordinates);
      } else {
        onLocationSelect(description, null);
      }
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setSelectedIndex(-1);
    
    if (value.length >= 3) {
      // Debounce API calls
      const timeoutId = setTimeout(() => {
        fetchPredictions(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Handle prediction selection
  const handlePredictionClick = (prediction) => {
    setSearchInput(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    getPlaceDetails(prediction.place_id, prediction.description);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handlePredictionClick(predictions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowPredictions(false);
        setSelectedIndex(-1);
        break;
      
      default:
        break;
    }
  };

  // Clear search input
  const handleClear = () => {
    setSearchInput('');
    setPredictions([]);
    setShowPredictions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Get current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Reverse geocode to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coordinates }, (results, status) => {
            setIsLoading(false);
            
            if (status === 'OK' && results[0]) {
              setSearchInput(results[0].formatted_address);
              onLocationSelect(results[0].formatted_address, coordinates);
            } else {
              setSearchInput('Current Location');
              onLocationSelect('Current Location', coordinates);
            }
          });
        } else {
          setIsLoading(false);
          setSearchInput('Current Location');
          onLocationSelect('Current Location', coordinates);
        }
      },
      (error) => {
        setIsLoading(false);
        alert('Unable to get your location: ' + error.message);
      }
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-shadow"
        />

        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {/* Clear Button */}
          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}

          {/* Current Location Button */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Use current location"
          >
            <MapPinIcon className={`h-5 w-5 ${isLoading ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          <ul className="py-2">
            {predictions.map((prediction, index) => (
              <li key={prediction.place_id}>
                <button
                  type="button"
                  onClick={() => handlePredictionClick(prediction)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {prediction.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {prediction.structured_formatting.secondary_text}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Searching...</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {showPredictions && !isLoading && predictions.length === 0 && searchInput.length >= 3 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">No locations found</p>
        </div>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  initialValue: PropTypes.string,
  onLocationSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchBar;
