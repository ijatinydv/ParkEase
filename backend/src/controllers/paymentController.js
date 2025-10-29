const razorpayService = require('../services/razorpayService');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const { convertToRupees } = require('../config/razorpay');

/**
 * Payment Controller - Handles all payment-related HTTP requests
 * 
 * Payment Flow:
 * 1. User creates booking -> booking status = 'pending'
 * 2. Frontend calls createPaymentOrder -> returns Razorpay order details
 * 3. Frontend shows Razorpay checkout with order ID
 * 4. User completes payment on Razorpay interface
 * 5. Razorpay redirects to callback URL with payment details
 * 6. Backend verifies payment signature
 * 7. Update booking status to 'confirmed' and create transaction
 * 8. Send confirmation to user
 */

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order for a booking
 * @access  Private (Authenticated users only)
 * 
 * @body    {String} bookingId - MongoDB booking ID
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user owns this booking
    if (booking.seekerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to make payment for this booking',
      });
    }

    // Check if booking is in valid state for payment
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot create payment order for booking with status: ${booking.status}`,
      });
    }

    // Check if order already exists for this booking
    const existingTransaction = await Transaction.findOne({
      bookingId: booking._id,
      status: { $in: ['pending', 'processing', 'completed'] },
    });

    if (existingTransaction && existingTransaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking',
      });
    }

    // Create Razorpay order
    const order = await razorpayService.createOrder(
      booking.totalAmount,
      booking._id,
      {
        notes: {
          userName: req.user.name,
          userEmail: req.user.email,
          userPhone: req.user.phone,
        },
      }
    );

    // Return order details to frontend
    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        amount: order.amountInRupees,
        amountInPaise: order.amount,
        currency: order.currency,
        transactionId: order.transactionId,
        keyId: process.env.RAZORPAY_KEY_ID, // Frontend needs this for Razorpay checkout
        booking: {
          id: booking._id,
          spotId: booking.spotId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          vehicleNumber: booking.vehicleNumber,
        },
        user: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
      },
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature and confirm booking
 * @access  Private
 * 
 * @body    {String} razorpay_order_id - Razorpay order ID
 * @body    {String} razorpay_payment_id - Razorpay payment ID
 * @body    {String} razorpay_signature - Razorpay signature
 */
const verifyPaymentCallback = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters',
      });
    }

    // Verify payment signature
    const isValid = razorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Log failed verification attempt
      console.error(
        `Payment verification failed - Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`
      );

      // Update transaction as failed
      const transaction = await Transaction.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (transaction) {
        await transaction.fail(
          'SIGNATURE_VERIFICATION_FAILED',
          'Payment signature verification failed'
        );
      }

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);

    // Find transaction by order ID
    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if payment was already processed
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed',
      });
    }

    // Update transaction with payment details
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = 'completed';
    transaction.paymentMethod = paymentDetails.method; // card, upi, netbanking, wallet
    transaction.gatewayResponse = paymentDetails;
    
    await transaction.save();

    // Find and update booking
    const booking = await Booking.findById(transaction.bookingId).populate(
      'spotId',
      'name address'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentId = razorpay_payment_id;
    
    await booking.save();

    console.log(
      `Payment verified successfully - Booking: ${booking._id}, Payment: ${razorpay_payment_id}`
    );

    // TODO: Send confirmation notifications
    // - Email to user with booking details
    // - SMS to user
    // - Notification to host
    // - Update calendar availability

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Booking confirmed!',
      data: {
        transactionId: transaction._id,
        bookingId: booking._id,
        paymentId: razorpay_payment_id,
        amount: transaction.amount,
        status: booking.status,
        booking: {
          id: booking._id,
          spot: booking.spotId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          vehicleNumber: booking.vehicleNumber,
          totalAmount: booking.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error in verifyPaymentCallback:', error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/payments/failure
 * @desc    Handle payment failure from frontend
 * @access  Private
 * 
 * @body    {String} orderId - Razorpay order ID
 * @body    {String} error - Error details
 */
const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      razorpayOrderId: orderId,
      userId: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Update transaction status
    await transaction.fail(
      error?.code || 'PAYMENT_FAILED',
      error?.description || 'Payment failed or cancelled by user'
    );

    // Update booking status
    const booking = await Booking.findById(transaction.bookingId);
    
    if (booking && booking.status === 'pending') {
      // Keep booking as pending, user can retry payment
      booking.internalNotes = `Payment failed: ${error?.description || 'Unknown error'}`;
      await booking.save();
    }

    console.log(
      `Payment failed - Transaction: ${transaction._id}, Reason: ${
        error?.description || 'User cancelled'
      }`
    );

    // TODO: Send notification to user
    // - Email about failed payment with retry option
    // - SMS notification

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded',
      data: {
        transactionId: transaction._id,
        bookingId: transaction.bookingId,
        canRetry: true,
        message: 'You can retry the payment or cancel the booking.',
      },
    });
  } catch (error) {
    console.error('Error in handlePaymentFailure:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment failure',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/payments/refund
 * @desc    Initiate refund for a cancelled booking
 * @access  Private
 * 
 * @body    {String} bookingId - MongoDB booking ID
 * @body    {String} reason - Refund reason
 */
const initiateRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const userId = req.user.id;

    // Validation
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    // Fetch booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization (either seeker or host can request refund)
    if (
      booking.seekerId.toString() !== userId &&
      booking.hostId.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to refund this booking',
      });
    }

    // Check if booking is eligible for refund
    if (!['confirmed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot refund booking with status: ${booking.status}`,
      });
    }

    // Find payment transaction
    const paymentTransaction = await Transaction.findOne({
      bookingId: booking._id,
      type: 'payment',
      status: 'completed',
    });

    if (!paymentTransaction || !paymentTransaction.razorpayPaymentId) {
      return res.status(404).json({
        success: false,
        message: 'No payment found for this booking',
      });
    }

    // Check if already refunded
    const existingRefund = await Transaction.findOne({
      bookingId: booking._id,
      type: 'refund',
      status: { $in: ['processing', 'completed'] },
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Refund already processed for this booking',
      });
    }

    // Calculate refund amount based on cancellation policy
    const refundAmount = calculateRefundAmount(booking);

    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This booking is not eligible for refund based on cancellation policy',
      });
    }

    // Create refund via Razorpay
    const refund = await razorpayService.createRefund(
      paymentTransaction.razorpayPaymentId,
      refundAmount,
      {
        reason: reason || 'Booking cancelled',
        initiatedBy: userId,
        bookingId: booking._id.toString(),
      }
    );

    // Update booking status if it was confirmed
    if (booking.status === 'confirmed') {
      booking.status = 'cancelled';
      booking.cancellationReason = reason || 'Refund initiated';
      booking.cancelledBy = userId;
      booking.cancelledAt = new Date();
      await booking.save();
    }

    console.log(
      `Refund initiated - Booking: ${bookingId}, Refund: ${refund.id}, Amount: ₹${refundAmount}`
    );

    // TODO: Send notifications
    // - Email to user about refund
    // - Notification to host
    // - Update calendar availability

    res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmount} initiated successfully`,
      data: {
        refundId: refund.id,
        amount: refundAmount,
        originalAmount: booking.totalAmount,
        status: refund.status,
        bookingId: booking._id,
        estimatedSettlement: '5-7 business days',
      },
    });
  } catch (error) {
    console.error('Error in initiateRefund:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund',
      error: error.message,
    });
  }
};

/**
 * Helper function to calculate refund amount based on cancellation policy
 * 
 * Refund Policy:
 * - 100% refund: If cancelled 24+ hours before booking start
 * - 50% refund: If cancelled 2-24 hours before booking start
 * - 0% refund: If cancelled less than 2 hours before or after start
 */
const calculateRefundAmount = (booking) => {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursUntilStart >= 24) {
    // Full refund if cancelled 24+ hours before
    refundPercentage = 100;
  } else if (hoursUntilStart >= 2) {
    // 50% refund if cancelled 2-24 hours before
    refundPercentage = 50;
  } else {
    // No refund if cancelled less than 2 hours before or after start
    refundPercentage = 0;
  }

  const refundAmount = (booking.totalAmount * refundPercentage) / 100;

  console.log(
    `Refund calculation - Hours until start: ${hoursUntilStart.toFixed(2)}, ` +
    `Refund: ${refundPercentage}% (₹${refundAmount})`
  );

  return refundAmount;
};

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for the logged-in user
 * @access  Private
 * 
 * @query   {Number} page - Page number (default: 1)
 * @query   {Number} limit - Items per page (default: 10)
 * @query   {String} type - Transaction type filter
 * @query   {String} status - Transaction status filter
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Fetch transactions
    const transactions = await Transaction.find(filter)
      .populate({
        path: 'bookingId',
        select: 'spotId startTime endTime vehicleNumber status',
        populate: {
          path: 'spotId',
          select: 'name address',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/transaction/:id
 * @desc    Get single transaction details
 * @access  Private
 */
const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findById(id)
      .populate({
        path: 'bookingId',
        select: 'spotId startTime endTime vehicleNumber status seekerId hostId',
        populate: {
          path: 'spotId',
          select: 'name address',
        },
      })
      .populate('userId', 'name email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check authorization
    if (
      transaction.userId._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this transaction',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction details retrieved successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Error in getTransactionDetails:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentCallback,
  handlePaymentFailure,
  initiateRefund,
  getPaymentHistory,
  getTransactionDetails,
  calculateRefundAmount, // Export for testing
};
