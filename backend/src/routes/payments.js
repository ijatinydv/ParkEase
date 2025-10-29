const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  verifyWebhookSignature,
  handleWebhook,
} = require('../middleware/razorpayWebhook');
const {
  createPaymentOrder,
  verifyPaymentCallback,
  handlePaymentFailure,
  initiateRefund,
  getPaymentHistory,
  getTransactionDetails,
} = require('../controllers/paymentController');

/**
 * Payment Routes
 * 
 * All routes are protected except webhook endpoint
 * Webhook endpoint has special signature verification middleware
 * 
 * Flow:
 * 1. POST /create-order - Create Razorpay order for a booking
 * 2. Frontend displays Razorpay checkout
 * 3. User completes payment on Razorpay
 * 4. POST /verify - Verify payment signature and confirm booking
 * 5. Razorpay sends webhook events for real-time updates
 */

// ============================================================================
// Public Routes (No authentication required)
// ============================================================================

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public (but signature verified)
 * 
 * Note: This endpoint must use express.raw() middleware to get raw body
 * for signature verification. Configure in main app.js:
 * 
 * app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
 * app.use('/api/payments/webhook', paymentRoutes);
 */
router.post('/webhook', verifyWebhookSignature, handleWebhook);

// ============================================================================
// Protected Routes (Authentication required)
// ============================================================================

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order for a booking
 * @access  Private
 * 
 * @body    {String} bookingId - MongoDB booking ID
 * 
 * @returns {Object} Order details including orderId, amount, keyId
 * 
 * @example
 * POST /api/payments/create-order
 * {
 *   "bookingId": "64abc123def456789"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "orderId": "order_MNopqrst123",
 *     "amount": 500,
 *     "currency": "INR",
 *     "keyId": "rzp_test_xxx"
 *   }
 * }
 */
router.post('/create-order', auth, createPaymentOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature from Razorpay callback
 * @access  Private
 * 
 * @body    {String} razorpay_order_id - Razorpay order ID
 * @body    {String} razorpay_payment_id - Razorpay payment ID
 * @body    {String} razorpay_signature - Razorpay signature
 * 
 * @returns {Object} Verified payment details and updated booking
 * 
 * @example
 * POST /api/payments/verify
 * {
 *   "razorpay_order_id": "order_MNopqrst123",
 *   "razorpay_payment_id": "pay_ABCxyz789",
 *   "razorpay_signature": "a1b2c3d4e5..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment verified successfully. Booking confirmed!",
 *   "data": {
 *     "transactionId": "64xyz...",
 *     "bookingId": "64abc...",
 *     "paymentId": "pay_ABCxyz789",
 *     "status": "confirmed"
 *   }
 * }
 */
router.post('/verify', auth, verifyPaymentCallback);

/**
 * @route   POST /api/payments/failure
 * @desc    Handle payment failure callback
 * @access  Private
 * 
 * @body    {String} orderId - Razorpay order ID
 * @body    {Object} error - Error details from Razorpay
 * 
 * @example
 * POST /api/payments/failure
 * {
 *   "orderId": "order_MNopqrst123",
 *   "error": {
 *     "code": "BAD_REQUEST_ERROR",
 *     "description": "Payment cancelled by user"
 *   }
 * }
 */
router.post('/failure', auth, handlePaymentFailure);

/**
 * @route   POST /api/payments/refund
 * @desc    Initiate refund for a cancelled booking
 * @access  Private
 * 
 * @body    {String} bookingId - MongoDB booking ID
 * @body    {String} reason - Refund reason
 * 
 * @returns {Object} Refund details
 * 
 * @example
 * POST /api/payments/refund
 * {
 *   "bookingId": "64abc123def456789",
 *   "reason": "Change of plans"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Refund of ₹500 initiated successfully",
 *   "data": {
 *     "refundId": "rfnd_XYZ123",
 *     "amount": 500,
 *     "status": "processing",
 *     "estimatedSettlement": "5-7 business days"
 *   }
 * }
 */
router.post('/refund', auth, initiateRefund);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for the logged-in user
 * @access  Private
 * 
 * @query   {Number} page - Page number (default: 1)
 * @query   {Number} limit - Items per page (default: 10)
 * @query   {String} type - Transaction type filter (payment, refund, etc.)
 * @query   {String} status - Transaction status filter (completed, pending, etc.)
 * 
 * @returns {Object} Paginated list of transactions
 * 
 * @example
 * GET /api/payments/history?page=1&limit=10&type=payment&status=completed
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "transactions": [...],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 25,
 *       "pages": 3
 *     }
 *   }
 * }
 */
router.get('/history', auth, getPaymentHistory);

/**
 * @route   GET /api/payments/transaction/:id
 * @desc    Get single transaction details
 * @access  Private
 * 
 * @param   {String} id - Transaction ID
 * 
 * @returns {Object} Transaction details with booking info
 * 
 * @example
 * GET /api/payments/transaction/64xyz789abc123
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "64xyz789abc123",
 *     "type": "payment",
 *     "amount": 500,
 *     "status": "completed",
 *     "razorpayPaymentId": "pay_ABC123",
 *     "booking": {...}
 *   }
 * }
 */
router.get('/transaction/:id', auth, getTransactionDetails);

// ============================================================================
// Admin Routes (Optional - for future implementation)
// ============================================================================

/**
 * @route   GET /api/payments/admin/transactions
 * @desc    Get all transactions (Admin only)
 * @access  Private/Admin
 * 
 * TODO: Implement admin middleware and controller
 */
// router.get('/admin/transactions', auth, adminAuth, getAllTransactions);

/**
 * @route   GET /api/payments/admin/revenue
 * @desc    Get platform revenue analytics
 * @access  Private/Admin
 * 
 * TODO: Implement admin middleware and controller
 */
// router.get('/admin/revenue', auth, adminAuth, getRevenueAnalytics);

/**
 * @route   POST /api/payments/admin/manual-refund
 * @desc    Manually process refund (Admin only)
 * @access  Private/Admin
 * 
 * TODO: Implement admin middleware and controller
 */
// router.post('/admin/manual-refund', auth, adminAuth, manualRefund);

module.exports = router;
