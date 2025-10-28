/**
 * Application Constants
 * Central location for all constant values used across the app
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ParkEase';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 12;
export const SEARCH_RESULTS_PAGE_SIZE = parseInt(import.meta.env.VITE_SEARCH_RESULTS_PAGE_SIZE) || 20;

// Map Configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const DEFAULT_LOCATION = {
  lat: parseFloat(import.meta.env.VITE_DEFAULT_LOCATION_LAT) || 28.6139,
  lng: parseFloat(import.meta.env.VITE_DEFAULT_LOCATION_LNG) || 77.2090,
};
export const MAP_DEFAULT_ZOOM = parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 13;
export const MAP_SEARCH_RADIUS = parseInt(import.meta.env.VITE_MAP_SEARCH_RADIUS) || 5000;

// Payment Configuration
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

// Image Upload Configuration
export const MAX_IMAGE_SIZE = parseInt(import.meta.env.VITE_MAX_IMAGE_SIZE) || 5242880; // 5MB
export const MAX_IMAGES_PER_LISTING = parseInt(import.meta.env.VITE_MAX_IMAGES_PER_LISTING) || 8;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Booking Configuration
export const MIN_BOOKING_HOURS = parseInt(import.meta.env.VITE_MIN_BOOKING_HOURS) || 1;
export const MAX_BOOKING_DAYS = parseInt(import.meta.env.VITE_MAX_BOOKING_DAYS) || 30;

// User Roles
export const USER_ROLES = {
  SEEKER: 'seeker',
  HOST: 'host',
  BOTH: 'both',
  ADMIN: 'admin',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Vehicle Types
export const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'suv', label: 'SUV' },
  { value: 'bike', label: 'Bike/Scooter' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

// Amenities
export const AMENITIES = [
  { value: 'covered', label: 'Covered Parking', icon: '🏠' },
  { value: 'security', label: 'Security Guard', icon: '👮' },
  { value: 'cctv', label: 'CCTV Surveillance', icon: '📹' },
  { value: 'ev_charging', label: 'EV Charging', icon: '⚡' },
  { value: 'lighting', label: 'Well Lit', icon: '💡' },
  { value: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿' },
  { value: 'automated', label: 'Automated Gate', icon: '🚪' },
  { value: 'washroom', label: 'Washroom Available', icon: '🚻' },
];

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Registration successful!',
  BOOKING_SUCCESS: 'Booking confirmed!',
  PAYMENT_SUCCESS: 'Payment successful!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_UNAUTHORIZED: 'Please login to continue.',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SEARCH: '/search',
  PARKING_DETAILS: '/parking/:id',
  ADD_PARKING: '/add-parking',
  MY_LISTINGS: '/my-listings',
  MY_BOOKINGS: '/my-bookings',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  PAYMENT: '/payment/:bookingId',
  NOT_FOUND: '*',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  RECENT_SEARCHES: 'recent_searches',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  API: 'yyyy-MM-dd',
  TIME: 'hh:mm a',
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6-9]\d{9}$/,
  PINCODE: /^[1-9][0-9]{5}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEFAULT_PAGE_SIZE,
  GOOGLE_MAPS_API_KEY,
  DEFAULT_LOCATION,
  USER_ROLES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  VERIFICATION_STATUS,
  VEHICLE_TYPES,
  AMENITIES,
  TOAST_MESSAGES,
  ROUTES,
  STORAGE_KEYS,
  DATE_FORMATS,
  REGEX_PATTERNS,
};
