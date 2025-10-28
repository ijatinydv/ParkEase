import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@utils/constants';

/**
 * Axios instance for API calls
 * Pre-configured with base URL, timeout, and interceptors
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds authentication token to all requests
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common response scenarios and errors
 */
api.interceptors.response.use(
  (response) => {
    // Return the data directly
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - show error
          console.error('Access forbidden:', data.message);
          break;

        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;

        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;

        default:
          console.error('API Error:', data.message);
      }

      return Promise.reject(data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

/**
 * API Helper Functions
 */

// GET request
export const get = (url, config = {}) => {
  return api.get(url, config);
};

// POST request
export const post = (url, data = {}, config = {}) => {
  return api.post(url, data, config);
};

// PUT request
export const put = (url, data = {}, config = {}) => {
  return api.put(url, data, config);
};

// PATCH request
export const patch = (url, data = {}, config = {}) => {
  return api.patch(url, data, config);
};

// DELETE request
export const del = (url, config = {}) => {
  return api.delete(url, config);
};

// Upload file (multipart/form-data)
export const upload = (url, formData, onUploadProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

export default api;
