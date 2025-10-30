import { motion } from 'framer-motion';
import {
  HomeIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
  BoltIcon,
  LightBulbIcon,
  UserGroupIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

/**
 * Amenities icon mapping
 */
const amenityIcons = {
  covered: HomeIcon,
  security: ShieldCheckIcon,
  cctv: VideoCameraIcon,
  ev_charging: BoltIcon,
  lighting: LightBulbIcon,
  wheelchair: UserGroupIcon,
  automated: LockClosedIcon,
  washroom: BuildingOfficeIcon,
};

/**
 * Amenity labels mapping
 */
const amenityLabels = {
  covered: 'Covered Parking',
  security: 'Security Guard',
  cctv: 'CCTV Surveillance',
  ev_charging: 'EV Charging',
  lighting: 'Well Lit',
  wheelchair: 'Wheelchair Accessible',
  automated: 'Automated Gate',
  washroom: 'Washroom Available',
};

/**
 * AmenitiesList Component
 * Displays parking spot amenities with icons
 */
const AmenitiesList = ({ amenities = [], className = '' }) => {
  if (!amenities || amenities.length === 0) {
    return (
      <div className={`text-neutral-500 ${className}`}>
        No amenities listed
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-xl font-semibold text-neutral-900 mb-4">
        Amenities
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {amenities.map((amenity, index) => {
          const Icon = amenityIcons[amenity] || HomeIcon;
          const label = amenityLabels[amenity] || amenity;

          return (
            <motion.div
              key={amenity}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-neutral-900 font-medium">{label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AmenitiesList;
