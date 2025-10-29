import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';

/**
 * Map container style
 */
const containerStyle = {
  width: '100%',
  height: '100%',
};

/**
 * Default map options
 */
const defaultMapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

/**
 * Google Maps libraries to load
 */
const libraries = ['places', 'geometry'];

/**
 * Custom marker colors based on availability and price
 */
const getMarkerColor = (spot) => {
  if (!spot.availability?.isAvailable) return '#EF4444'; // Red for unavailable
  if (spot.pricePerHour < 50) return '#10B981'; // Green for cheap
  if (spot.pricePerHour < 100) return '#F59E0B'; // Orange for medium
  return '#3B82F6'; // Blue for expensive
};

/**
 * MapView Component
 * Displays parking spots on Google Maps with custom markers and clustering
 */
const MapView = ({ spots = [], center, onSpotClick, zoom = 13 }) => {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const mapRef = useRef(null);

  // Update map center when prop changes
  useEffect(() => {
    setMapCenter(center);
    if (mapInstance && center) {
      mapInstance.panTo(center);
    }
  }, [center, mapInstance]);

  // Fit bounds to show all markers when spots change
  useEffect(() => {
    if (mapInstance && spots.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      spots.forEach(spot => {
        if (spot.location?.coordinates) {
          bounds.extend({
            lat: spot.location.coordinates[1],
            lng: spot.location.coordinates[0],
          });
        }
      });
      
      // Only fit bounds if there are multiple spots
      if (spots.length > 1) {
        mapInstance.fitBounds(bounds);
      }
    }
  }, [spots, mapInstance]);

  // Handle map load
  const onMapLoad = (map) => {
    setMapInstance(map);
    mapRef.current = map;
  };

  // Handle marker click
  const handleMarkerClick = (spot) => {
    setSelectedSpot(spot);
    if (onSpotClick) {
      onSpotClick(spot._id);
    }
  };

  // Close info window
  const handleInfoWindowClose = () => {
    setSelectedSpot(null);
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!googleMapsApiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsApiKey}
      libraries={libraries}
      loadingElement={<MapLoadingState />}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={defaultMapOptions}
        onLoad={onMapLoad}
      >
        {/* Marker Clustering for better performance */}
        <MarkerClusterer
          options={{
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            gridSize: 50,
            maxZoom: 15,
          }}
        >
          {(clusterer) => (
            <>
              {spots.map((spot) => {
                if (!spot.location?.coordinates) return null;

                const position = {
                  lat: spot.location.coordinates[1],
                  lng: spot.location.coordinates[0],
                };

                return (
                  <Marker
                    key={spot._id}
                    position={position}
                    clusterer={clusterer}
                    onClick={() => handleMarkerClick(spot)}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: getMarkerColor(spot),
                      fillOpacity: 0.9,
                      strokeColor: '#FFFFFF',
                      strokeWeight: 2,
                    }}
                    animation={selectedSpot?._id === spot._id 
                      ? window.google.maps.Animation.BOUNCE 
                      : null
                    }
                  />
                );
              })}
            </>
          )}
        </MarkerClusterer>

        {/* Info Window for selected spot */}
        {selectedSpot && selectedSpot.location?.coordinates && (
          <InfoWindow
            position={{
              lat: selectedSpot.location.coordinates[1],
              lng: selectedSpot.location.coordinates[0],
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              {/* Image */}
              {selectedSpot.images && selectedSpot.images.length > 0 && (
                <img
                  src={selectedSpot.images[0]}
                  alt={selectedSpot.title}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.target.src = '/assets/placeholder-parking.jpg';
                  }}
                />
              )}

              {/* Title */}
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                {selectedSpot.title || 'Parking Spot'}
              </h3>

              {/* Location */}
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {selectedSpot.location.address || selectedSpot.location.city || 'Location'}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(selectedSpot.pricePerHour || 0)}
                </span>
                <span className="text-sm text-gray-500">/hour</span>
              </div>

              {/* Rating */}
              {selectedSpot.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedSpot.rating.toFixed(1)}
                  </span>
                  {selectedSpot.reviews && (
                    <span className="text-xs text-gray-500">
                      ({selectedSpot.reviews.length} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Availability */}
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedSpot.availability?.isAvailable !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedSpot.availability?.isAvailable !== false ? 'Available' : 'Occupied'}
                </span>
              </div>

              {/* View Details Button */}
              <a
                href={`/spots/${selectedSpot._id}`}
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/spots/${selectedSpot._id}`;
                }}
              >
                View Details
              </a>
            </div>
          </InfoWindow>
        )}

        {/* User's current location marker (optional) */}
        {center && (
          <Marker
            position={center}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4F46E5',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
            }}
            title="Your Location"
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

/**
 * Map Loading State Component
 */
const MapLoadingState = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading map...</p>
    </div>
  </div>
);

MapView.propTypes = {
  spots: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string,
      location: PropTypes.shape({
        coordinates: PropTypes.arrayOf(PropTypes.number),
        address: PropTypes.string,
        city: PropTypes.string,
      }),
      images: PropTypes.arrayOf(PropTypes.string),
      pricePerHour: PropTypes.number,
      rating: PropTypes.number,
      reviews: PropTypes.arrayOf(PropTypes.object),
      availability: PropTypes.shape({
        isAvailable: PropTypes.bool,
      }),
    })
  ),
  center: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  onSpotClick: PropTypes.func,
  zoom: PropTypes.number,
};

export default MapView;
