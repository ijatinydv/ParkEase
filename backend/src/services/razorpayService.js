const crypto = require('crypto');
const {
  getRazorpayInstance,
  paymentConfig,
  generateReceiptId,
  convertToPaise,
  convertToRupees,
} = require('../config/razorpay');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');

/**
 * Razorpay Service - Handles all payment gateway operations
 * 
 * Flow:
 * 1. Create Order -> Generate Razorpay order ID
 * 2. Frontend initiates payment with order ID
 * 3. User completes payment on Razorpay
 * 4. Verify payment signature on callback
 * 5. Update booking and create transaction record
 * 
 * Documentation: https://razorpay.com/docs/payments/server-integration/
 */

class RazorpayService {
  constructor() {
    this.razorpay = getRazorpayInstance();
    
    if (!this.razorpay) {
      throw new Error('Razorpay instance not initialized. Check your credentials.');
    }
  }

  /**
   * Create a Razorpay order for a booking
   * 
   * @param {Number} amount - Amount in rupees
   * @param {String} bookingId - MongoDB booking ID
   * @param {Object} additionalData - Additional order data (optional)
   * @returns {Promise<Object>} Order object with id, amount, currency
   * 
   * @example
   * const order = await razorpayService.createOrder(500, bookingId);
   * // Returns: { id: 'order_xxx', amount: 50000, currency: 'INR', ... }
   */
  async createOrder(amount, bookingId, additionalData = {}) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount. Amount must be greater than 0');
      }

      // Convert amount to paise (Razorpay uses smallest currency unit)
      const amountInPaise = convertToPaise(amount);

      // Validate amount range
      if (amountInPaise < paymentConfig.minAmount) {
        throw new Error(
          `Amount too low. Minimum amount is ₹${convertToRupees(paymentConfig.minAmount)}`
        );
      }

      if (amountInPaise > paymentConfig.maxAmount) {
        throw new Error(
          `Amount too high. Maximum amount is ₹${convertToRupees(paymentConfig.maxAmount)}`
        );
      }

      // Verify booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Verify booking is in valid state for payment
      if (!['pending'].includes(booking.status)) {
        throw new Error(`Cannot create payment for booking with status: ${booking.status}`);
      }

      // Generate unique receipt ID
      const receipt = generateReceiptId();

      // Prepare order options
      const orderOptions = {
        amount: amountInPaise, // Amount in paise
        currency: paymentConfig.currency,
        receipt: receipt,
        payment_capture: paymentConfig.autoCapture ? 1 : 0, // Auto-capture payment
        notes: {
          bookingId: bookingId.toString(),
          spotId: booking.spotId.toString(),
          seekerId: booking.seekerId.toString(),
          vehicleNumber: booking.vehicleNumber,
          ...additionalData.notes,
        },
      };

      // Create order on Razorpay
      const razorpayOrder = await this.razorpay.orders.create(orderOptions);

      console.log(`Razorpay order created: ${razorpayOrder.id} for booking: ${bookingId}`);

      // Create transaction record in database
      const transaction = new Transaction({
        bookingId: booking._id,
        userId: booking.seekerId,
        type: 'payment',
        amount: amount,
        platformFee: booking.platformFee,
        netAmount: booking.hostEarnings,
        currency: paymentConfig.currency,
        status: 'pending',
        gateway: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
        description: `Payment for parking booking #${bookingId}`,
        metadata: {
          receipt: receipt,
          spotId: booking.spotId.toString(),
          vehicleNumber: booking.vehicleNumber,
        },
      });

      await transaction.save();

      // Update booking with order ID
      booking.razorpayOrderId = razorpayOrder.id;
      await booking.save();

      console.log(`Transaction created: ${transaction._id} for order: ${razorpayOrder.id}`);

      // Return order details for frontend
      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        amountInRupees: amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        createdAt: razorpayOrder.created_at,
        transactionId: transaction._id,
        bookingId: booking._id,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error.message);
      
      // Log error to transaction if it was created
      if (bookingId) {
        const transaction = await Transaction.findOne({
          bookingId,
          status: 'pending',
        }).sort({ createdAt: -1 });
        
        if (transaction) {
          await transaction.fail('ORDER_CREATION_FAILED', error.message);
        }
      }

      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment signature
   * 
   * Security: This prevents payment tampering by verifying the signature
   * sent by Razorpay matches our calculated signature using the secret key
   * 
   * @param {String} orderId - Razorpay order ID
   * @param {String} paymentId - Razorpay payment ID
   * @param {String} signature - Razorpay signature
   * @returns {Boolean} True if signature is valid, false otherwise
   * 
   * @example
   * const isValid = razorpayService.verifyPayment(orderId, paymentId, signature);
   */
  verifyPayment(orderId, paymentId, signature) {
    try {
      if (!orderId || !paymentId || !signature) {
        console.error('Missing payment verification parameters');
        return false;
      }

      // Create the signature string: order_id|payment_id
      const signatureString = `${orderId}|${paymentId}`;

      // Generate expected signature using HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(signatureString)
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );

      if (isValid) {
        console.log(`Payment signature verified successfully for order: ${orderId}`);
      } else {
        console.warn(`Payment signature verification failed for order: ${orderId}`);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying payment signature:', error.message);
      return false;
    }
  }

  /**
   * Verify webhook signature from Razorpay
   * 
   * @param {String} webhookBody - Raw webhook request body
   * @param {String} signature - Razorpay webhook signature header
   * @returns {Boolean} True if signature is valid
   */
  verifyWebhookSignature(webhookBody, signature) {
    try {
      if (!signature) {
        console.error('Missing webhook signature');
        return false;
      }

      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('Webhook secret not configured');
        return false;
      }

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );

      if (isValid) {
        console.log('Webhook signature verified successfully');
      } else {
        console.warn('Webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   * 
   * @param {String} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      console.log(`Fetched payment details for: ${paymentId}`);
      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error.message);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Fetch order details from Razorpay
   * 
   * @param {String} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async fetchOrder(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      console.log(`Fetched order details for: ${orderId}`);
      return order;
    } catch (error) {
      console.error('Error fetching order:', error.message);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Create a refund for a payment
   * 
   * Refund Policy:
   * - Full refund: If cancelled 24+ hours before booking start
   * - 50% refund: If cancelled 2-24 hours before booking start
   * - No refund: If cancelled less than 2 hours before or after start
   * 
   * @param {String} paymentId - Razorpay payment ID
   * @param {Number} amount - Amount to refund in rupees (optional, full refund if not specified)
   * @param {Object} notes - Additional notes for refund
   * @returns {Promise<Object>} Refund object
   * 
   * @example
   * const refund = await razorpayService.createRefund(paymentId, 250, { reason: 'Cancellation' });
   */
  async createRefund(paymentId, amount = null, notes = {}) {
    try {
      if (!paymentId) {
        throw new Error('Payment ID is required for refund');
      }

      // Fetch payment details to verify it exists and get total amount
      const payment = await this.fetchPayment(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        throw new Error(
          `Cannot refund payment with status: ${payment.status}. Only captured/authorized payments can be refunded.`
        );
      }

      // Prepare refund options
      const refundOptions = {
        payment_id: paymentId,
        notes: {
          refundReason: notes.reason || 'User requested refund',
          refundInitiatedBy: notes.initiatedBy || 'system',
          ...notes,
        },
      };

      // If amount is specified, refund partial amount
      if (amount !== null && amount > 0) {
        const amountInPaise = convertToPaise(amount);
        
        // Validate partial refund amount
        if (amountInPaise > payment.amount) {
          throw new Error(
            `Refund amount (₹${amount}) cannot exceed payment amount (₹${convertToRupees(payment.amount)})`
          );
        }
        
        refundOptions.amount = amountInPaise;
      }
      // Otherwise, full refund (don't specify amount)

      // Create refund on Razorpay
      const razorpayRefund = await this.razorpay.payments.refund(paymentId, refundOptions);

      console.log(
        `Refund created: ${razorpayRefund.id} for payment: ${paymentId}, amount: ₹${
          razorpayRefund.amount ? convertToRupees(razorpayRefund.amount) : 'Full'
        }`
      );

      // Find and update transaction
      const transaction = await Transaction.findOne({ razorpayPaymentId: paymentId });
      
      if (transaction) {
        // Create refund transaction record
        const refundTransaction = new Transaction({
          bookingId: transaction.bookingId,
          userId: transaction.userId,
          type: 'refund',
          amount: razorpayRefund.amount ? convertToRupees(razorpayRefund.amount) : transaction.amount,
          platformFee: 0, // No platform fee on refunds
          currency: paymentConfig.currency,
          status: 'processing',
          gateway: 'razorpay',
          razorpayRefundId: razorpayRefund.id,
          razorpayPaymentId: paymentId,
          originalTransactionId: transaction._id,
          refundReason: notes.reason || 'User requested refund',
          description: `Refund for payment ${paymentId}`,
          gatewayResponse: razorpayRefund,
        });

        await refundTransaction.save();

        // Update original transaction status
        if (razorpayRefund.amount === payment.amount) {
          transaction.status = 'refunded';
          transaction.refundedAt = new Date();
        }
        
        await transaction.save();

        console.log(`Refund transaction created: ${refundTransaction._id}`);
      }

      // Return refund details
      return {
        id: razorpayRefund.id,
        paymentId: razorpayRefund.payment_id,
        amount: razorpayRefund.amount,
        amountInRupees: convertToRupees(razorpayRefund.amount),
        currency: razorpayRefund.currency,
        status: razorpayRefund.status,
        createdAt: razorpayRefund.created_at,
        notes: razorpayRefund.notes,
      };
    } catch (error) {
      console.error('Error creating refund:', error.message);
      
      // Log failed refund attempt
      const transaction = await Transaction.findOne({ razorpayPaymentId: paymentId });
      if (transaction) {
        transaction.internalNotes = `Refund failed: ${error.message}`;
        await transaction.save();
      }

      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Fetch refund details from Razorpay
   * 
   * @param {String} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  async fetchRefund(refundId) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      console.log(`Fetched refund details for: ${refundId}`);
      return refund;
    } catch (error) {
      console.error('Error fetching refund:', error.message);
      throw new Error(`Failed to fetch refund: ${error.message}`);
    }
  }

  /**
   * Capture an authorized payment
   * Used when payment_capture is set to 0 during order creation
   * 
   * @param {String} paymentId - Razorpay payment ID
   * @param {Number} amount - Amount to capture in rupees
   * @returns {Promise<Object>} Captured payment details
   */
  async capturePayment(paymentId, amount) {
    try {
      const amountInPaise = convertToPaise(amount);
      
      const capturedPayment = await this.razorpay.payments.capture(
        paymentId,
        amountInPaise,
        paymentConfig.currency
      );

      console.log(`Payment captured: ${paymentId}, amount: ₹${amount}`);

      return capturedPayment;
    } catch (error) {
      console.error('Error capturing payment:', error.message);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Get all payments for an order
   * 
   * @param {String} orderId - Razorpay order ID
   * @returns {Promise<Array>} List of payments
   */
  async getOrderPayments(orderId) {
    try {
      const order = await this.fetchOrder(orderId);
      const payments = await this.razorpay.orders.fetchPayments(orderId);
      
      console.log(`Found ${payments.items.length} payments for order: ${orderId}`);
      
      return payments.items;
    } catch (error) {
      console.error('Error fetching order payments:', error.message);
      throw new Error(`Failed to fetch order payments: ${error.message}`);
    }
  }
}

// Export singleton instance
const razorpayService = new RazorpayService();

module.exports = razorpayService;
