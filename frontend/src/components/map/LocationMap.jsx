import { useEffect, useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/solid';
import Spinner from '@components/common/Spinner';
import { GOOGLE_MAPS_API_KEY } from '@utils/constants';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const defaultMapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

/**
 * LocationMap Component
 * Displays parking spot location on Google Maps
 */
const LocationMap = ({ location, address, spotName }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.2090 });

  useEffect(() => {
    if (location?.coordinates) {
      const [lng, lat] = location.coordinates;
      setCenter({ lat, lng });
    }
  }, [location]);



  if (loadError) {
    return (
      <div className="w-full h-96 bg-neutral-100 rounded-lg flex flex-col items-center justify-center text-neutral-600">
        <MapPinIcon className="w-12 h-12 mb-2 text-neutral-400" />
        <p>Error loading map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-neutral-100 rounded-lg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Location
        </h3>
        <p className="text-neutral-700">{address || 'Address not provided'}</p>
      </div>

      <div className="rounded-lg overflow-hidden border border-neutral-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={defaultMapOptions}
        >
          <Marker
            position={center}
            title={spotName || 'Parking spot'}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
          />
        </GoogleMap>
      </div>

      {/* Location details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Exact location is provided after booking confirmation
          to protect host privacy.
        </p>
      </div>
    </div>
  );
};

export default LocationMap;
