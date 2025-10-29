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
   * Search spots by location
   */
  searchSpots: async (lat, lng, radius = 5) => {
    return await apiService.get(`/spots/search?lat=${lat}&lng=${lng}&radius=${radius}`);
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
