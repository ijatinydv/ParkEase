import apiService from './api';

const reviewService = {
  /**
   * Create review
   */
  createReview: async (reviewData) => {
    return await apiService.post('/reviews', reviewData);
  },

  /**
   * Get spot reviews
   */
  getSpotReviews: async (spotId) => {
    return await apiService.get(`/reviews/spot/${spotId}`);
  },

  /**
   * Get user reviews
   */
  getUserReviews: async (userId) => {
    return await apiService.get(`/reviews/user/${userId}`);
  },

  /**
   * Update review
   */
  updateReview: async (id, reviewData) => {
    return await apiService.put(`/reviews/${id}`, reviewData);
  },

  /**
   * Delete review
   */
  deleteReview: async (id) => {
    return await apiService.delete(`/reviews/${id}`);
  },

  /**
   * Reply to review (for providers)
   */
  replyToReview: async (id, reply) => {
    return await apiService.post(`/reviews/${id}/reply`, { reply });
  },
};

export default reviewService;
