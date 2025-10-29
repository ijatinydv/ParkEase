import apiService from './api';

const paymentService = {
  /**
   * Create payment order
   */
  createOrder: async (bookingId) => {
    return await apiService.post('/payments/create-order', { bookingId });
  },

  /**
   * Verify payment
   */
  verifyPayment: async (paymentData) => {
    return await apiService.post('/payments/verify', paymentData);
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async () => {
    return await apiService.get('/payments/history');
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (id) => {
    return await apiService.get(`/payments/${id}`);
  },

  /**
   * Request refund
   */
  requestRefund: async (paymentId, reason) => {
    return await apiService.post(`/payments/${paymentId}/refund`, { reason });
  },
};

export default paymentService;
