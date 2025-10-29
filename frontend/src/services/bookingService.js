import apiService from './api';

const bookingService = {
  /**
   * Create new booking
   */
  createBooking: async (bookingData) => {
    return await apiService.post('/bookings', bookingData);
  },

  /**
   * Get user bookings
   */
  getMyBookings: async (status = null) => {
    const url = status ? `/bookings?status=${status}` : '/bookings';
    return await apiService.get(url);
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (id) => {
    return await apiService.get(`/bookings/${id}`);
  },

  /**
   * Cancel booking
   */
  cancelBooking: async (id, reason = '') => {
    return await apiService.post(`/bookings/${id}/cancel`, { reason });
  },

  /**
   * Confirm booking (for providers)
   */
  confirmBooking: async (id) => {
    return await apiService.post(`/bookings/${id}/confirm`);
  },

  /**
   * Complete booking
   */
  completeBooking: async (id) => {
    return await apiService.post(`/bookings/${id}/complete`);
  },

  /**
   * Check spot availability
   */
  checkAvailability: async (spotId, startTime, endTime) => {
    return await apiService.post('/bookings/check-availability', {
      spotId,
      startTime,
      endTime,
    });
  },
};

export default bookingService;
