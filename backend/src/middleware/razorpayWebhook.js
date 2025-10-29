const razorpayService = require('../services/razorpayService');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');

/**
 * Razorpay Webhook Middleware
 * 
 * Razorpay sends webhook events for various payment lifecycle events:
 * - payment.authorized - Payment authorized (needs manual capture)
 * - payment.captured - Payment successfully captured
 * - payment.failed - Payment failed
 * - order.paid - Order fully paid
 * - refund.created - Refund initiated
 * - refund.processed - Refund processed successfully
 * - refund.failed - Refund failed
 * 
 * Documentation: https://razorpay.com/docs/webhooks/
 * 
 * Setup Instructions:
 * 1. Go to Razorpay Dashboard -> Settings -> Webhooks
 * 2. Add webhook URL: https://yourdomain.com/api/payments/webhook
 * 3. Select events to track
 * 4. Copy webhook secret and add to .env as RAZORPAY_WEBHOOK_SECRET
 */

/**
 * Verify Razorpay webhook signature
 * This ensures the webhook request is genuine and from Razorpay
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    // Get signature from header
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      console.error('Webhook signature missing');
      return res.status(400).json({
        success: false,
        message: 'Webhook signature missing',
      });
    }

    // Get raw body (important: must be raw string, not parsed JSON)
    // Make sure to use express.raw() middleware for webhook route
    const webhookBody = JSON.stringify(req.body);

    // Verify signature
    const isValid = razorpayService.verifyWebhookSignature(
      webhookBody,
      signature
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    console.log('Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('Error verifying webhook signature:', error.message);
    res.status(500).json({
      success: false,
      message: 'Webhook verification failed',
      error: error.message,
    });
  }
};

/**
 * Handle Razorpay webhook events
 * Process different types of payment events
 */
const handleWebhook = async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received webhook event: ${event}`);

    // Route to appropriate handler based on event type
    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'order.paid':
        await handleOrderPaid(payload);
        break;

      case 'refund.created':
        await handleRefundCreated(payload);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;

      case 'refund.failed':
        await handleRefundFailed(payload);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Error handling webhook:', error.message);
    
    // Still return 200 to prevent Razorpay from retrying
    // Log the error for manual review
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message,
    });
  }
};

/**
 * Handle payment.authorized event
 * Triggered when payment is authorized but not yet captured
 */
const handlePaymentAuthorized = async (payload) => {
  const payment = payload.payment.entity;
  
  console.log(`Payment authorized: ${payment.id}`);

  const transaction = await Transaction.findOne({
    razorpayOrderId: payment.order_id,
  });

  if (transaction) {
    transaction.razorpayPaymentId = payment.id;
    transaction.status = 'processing';
    transaction.paymentMethod = payment.method;
    transaction.gatewayResponse = payment;
    await transaction.save();

    console.log(`Transaction updated: ${transaction._id} - Status: processing`);
  }
};

/**
 * Handle payment.captured event
 * Triggered when payment is successfully captured
 * This is the most important event for successful payments
 */
const handlePaymentCaptured = async (payload) => {
  const payment = payload.payment.entity;
  
  console.log(`Payment captured: ${payment.id}, Amount: ${payment.amount}`);

  // Find transaction
  const transaction = await Transaction.findOne({
    razorpayOrderId: payment.order_id,
  });

  if (!transaction) {
    console.error(`Transaction not found for order: ${payment.order_id}`);
    return;
  }

  // Update transaction
  transaction.razorpayPaymentId = payment.id;
  transaction.status = 'completed';
  transaction.paymentMethod = payment.method;
  transaction.gatewayResponse = payment;
  await transaction.save();

  console.log(`Transaction completed: ${transaction._id}`);

  // Update booking
  const booking = await Booking.findById(transaction.bookingId);
  
  if (booking) {
    booking.status = 'confirmed';
    booking.razorpayPaymentId = payment.id;
    booking.paymentId = payment.id;
    await booking.save();

    console.log(`Booking confirmed: ${booking._id}`);

    // TODO: Send notifications
    // - Confirmation email to user
    // - Notification to host
    // - SMS confirmations
  }
};

/**
 * Handle payment.failed event
 * Triggered when payment fails
 */
const handlePaymentFailed = async (payload) => {
  const payment = payload.payment.entity;
  
  console.log(
    `Payment failed: ${payment.id}, Reason: ${payment.error_description}`
  );

  const transaction = await Transaction.findOne({
    razorpayOrderId: payment.order_id,
  });

  if (transaction) {
    await transaction.fail(
      payment.error_code || 'PAYMENT_FAILED',
      payment.error_description || 'Payment failed'
    );

    console.log(`Transaction marked as failed: ${transaction._id}`);

    // TODO: Send notification to user about failed payment
  }
};

/**
 * Handle order.paid event
 * Triggered when an order is fully paid
 */
const handleOrderPaid = async (payload) => {
  const order = payload.order.entity;
  
  console.log(`Order paid: ${order.id}`);

  const transaction = await Transaction.findOne({
    razorpayOrderId: order.id,
  });

  if (transaction && transaction.status !== 'completed') {
    transaction.status = 'completed';
    await transaction.save();

    console.log(`Transaction completed via order.paid: ${transaction._id}`);
  }
};

/**
 * Handle refund.created event
 * Triggered when a refund is created
 */
const handleRefundCreated = async (payload) => {
  const refund = payload.refund.entity;
  
  console.log(`Refund created: ${refund.id}, Amount: ${refund.amount}`);

  // Find refund transaction
  const refundTransaction = await Transaction.findOne({
    razorpayRefundId: refund.id,
  });

  if (refundTransaction) {
    refundTransaction.status = 'processing';
    refundTransaction.gatewayResponse = refund;
    await refundTransaction.save();

    console.log(`Refund transaction updated: ${refundTransaction._id}`);
  }
};

/**
 * Handle refund.processed event
 * Triggered when a refund is successfully processed
 */
const handleRefundProcessed = async (payload) => {
  const refund = payload.refund.entity;
  
  console.log(
    `Refund processed: ${refund.id}, Amount: ${refund.amount}, Speed: ${refund.speed_processed}`
  );

  // Find refund transaction
  const refundTransaction = await Transaction.findOne({
    razorpayRefundId: refund.id,
  });

  if (refundTransaction) {
    refundTransaction.status = 'completed';
    refundTransaction.gatewayResponse = refund;
    await refundTransaction.save();

    console.log(`Refund completed: ${refundTransaction._id}`);

    // Update original transaction
    const originalTransaction = await Transaction.findById(
      refundTransaction.originalTransactionId
    );

    if (originalTransaction) {
      originalTransaction.status = 'refunded';
      originalTransaction.refundedAt = new Date();
      await originalTransaction.save();
    }

    // Update booking status
    const booking = await Booking.findById(refundTransaction.bookingId);
    
    if (booking && booking.status !== 'cancelled') {
      booking.status = 'cancelled';
      booking.cancellationReason = 'Refund processed';
      booking.cancelledAt = new Date();
      await booking.save();
    }

    // TODO: Send notification to user about successful refund
  }
};

/**
 * Handle refund.failed event
 * Triggered when a refund fails
 */
const handleRefundFailed = async (payload) => {
  const refund = payload.refund.entity;
  
  console.error(
    `Refund failed: ${refund.id}, Reason: ${refund.error_description}`
  );

  const refundTransaction = await Transaction.findOne({
    razorpayRefundId: refund.id,
  });

  if (refundTransaction) {
    await refundTransaction.fail(
      refund.error_code || 'REFUND_FAILED',
      refund.error_description || 'Refund failed'
    );

    console.log(`Refund transaction marked as failed: ${refundTransaction._id}`);

    // TODO: Send notification to admin and user about failed refund
    // Manual intervention may be required
  }
};

/**
 * Webhook event handler mapping
 * This is used for documentation and testing purposes
 */
const webhookEvents = {
  'payment.authorized': {
    description: 'Payment is authorized but not captured',
    handler: handlePaymentAuthorized,
  },
  'payment.captured': {
    description: 'Payment is successfully captured',
    handler: handlePaymentCaptured,
  },
  'payment.failed': {
    description: 'Payment has failed',
    handler: handlePaymentFailed,
  },
  'order.paid': {
    description: 'Order is fully paid',
    handler: handleOrderPaid,
  },
  'refund.created': {
    description: 'Refund is created',
    handler: handleRefundCreated,
  },
  'refund.processed': {
    description: 'Refund is successfully processed',
    handler: handleRefundProcessed,
  },
  'refund.failed': {
    description: 'Refund has failed',
    handler: handleRefundFailed,
  },
};

module.exports = {
  verifyWebhookSignature,
  handleWebhook,
  webhookEvents,
};
