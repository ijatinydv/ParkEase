import apiService from './api';

const spotService = {
  /**
   * Get all parking spots with filters
   */
  getSpots: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiService.get(`/spots?${params}`);
  },

  /**
   * Get single spot by ID
   */
  getSpotById: async (id) => {
    return await apiService.get(`/spots/${id}`);
  },

  /**
   * Search spots with comprehensive filters
   * @param {Object} filters - Filter parameters
   * @param {number} filters.lat - Latitude
   * @param {number} filters.lng - Longitude
   * @param {number} filters.radius - Search radius in km
   * @param {number} filters.minPrice - Minimum price per hour
   * @param {number} filters.maxPrice - Maximum price per hour
   * @param {string} filters.types - Comma-separated spot types
   * @param {string} filters.amenities - Comma-separated amenities
   * @param {string} filters.startDate - Start date for availability
   * @param {string} filters.endDate - End date for availability
   * @param {string} filters.sortBy - Sort field (price, rating, distance)
   * @param {string} filters.sortOrder - Sort order (asc, desc)
   * @param {number} filters.page - Page number
   * @param {number} filters.limit - Results per page
   * @returns {Promise} Spots data with pagination
   */
  searchSpots: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add all filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    return await apiService.get(`/spots/search?${params.toString()}`);
  },

  /**
   * Get nearby parking spots
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in km (default: 5)
   * @param {Object} additionalFilters - Additional filter options
   * @returns {Promise} Nearby spots
   */
  getNearbySpots: async (lat, lng, radius = 5, additionalFilters = {}) => {
    const params = new URLSearchParams({
      lat,
      lng,
      radius,
      ...additionalFilters
    });

    return await apiService.get(`/spots/nearby?${params.toString()}`);
  },

  /**
   * Create new parking spot
   */
  createSpot: async (spotData) => {
    return await apiService.post('/spots', spotData);
  },

  /**
   * Update parking spot
   */
  updateSpot: async (id, spotData) => {
    return await apiService.put(`/spots/${id}`, spotData);
  },

  /**
   * Delete parking spot
   */
  deleteSpot: async (id) => {
    return await apiService.delete(`/spots/${id}`);
  },

  /**
   * Get user's spots
   */
  getMySpots: async () => {
    return await apiService.get('/spots/my-spots');
  },

  /**
   * Upload spot images
   */
  uploadSpotImages: async (spotId, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    return await apiService.upload(`/spots/${spotId}/images`, formData);
  },
};

export default spotService;
