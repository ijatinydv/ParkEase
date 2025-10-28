const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['payment', 'refund', 'payout', 'penalty', 'bonus'],
        message: 'Type must be one of: payment, refund, payout, penalty, bonus'
      },
      required: [true, 'Transaction type is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    platformFee: {
      type: Number,
      min: [0, 'Platform fee cannot be negative'],
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP'],
        message: 'Currency not supported'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        message: 'Invalid transaction status'
      },
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
        message: 'Invalid payment method'
      }
    },
    // Razorpay integration fields
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    razorpayRefundId: {
      type: String,
      trim: true
    },
    // Gateway response (store full response for debugging)
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Payment gateway details
    gateway: {
      type: String,
      enum: {
        values: ['razorpay', 'stripe', 'paytm', 'phonepe', 'manual'],
        message: 'Invalid payment gateway'
      },
      default: 'razorpay'
    },
    // Transaction metadata
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    // Refund details
    refundReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters']
    },
    refundedAt: {
      type: Date
    },
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true
    },
    // Payout details (for host earnings)
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet'],
      default: 'bank_transfer'
    },
    payoutDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      upiId: String,
      walletId: String
    },
    payoutDate: {
      type: Date
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    // Settlement details
    settlementId: {
      type: String,
      trim: true
    },
    settledAt: {
      type: Date
    },
    // Error tracking
    errorCode: {
      type: String,
      trim: true
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Error message cannot exceed 500 characters']
    },
    retryCount: {
      type: Number,
      min: [0, 'Retry count cannot be negative'],
      default: 0
    },
    // Internal notes
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
    },
    // Metadata for custom data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
transactionSchema.index({ userId: 1, type: 1, status: 1 });
transactionSchema.index({ bookingId: 1, type: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ razorpayPaymentId: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Virtual for 'id'
transactionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual to populate booking details
transactionSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
transactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate net amount
transactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('platformFee')) {
    this.netAmount = this.amount - this.platformFee;
  }
  next();
});

// Pre-save middleware to validate refund
transactionSchema.pre('save', function (next) {
  if (this.type === 'refund' && !this.originalTransactionId) {
    return next(new Error('Original transaction ID is required for refunds'));
  }
  next();
});

// Method to mark transaction as completed
transactionSchema.methods.complete = function (gatewayResponse = {}) {
  this.status = 'completed';
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayResponse };
  return this.save();
};

// Method to mark transaction as failed
transactionSchema.methods.fail = function (errorCode, errorMessage) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  return this.save();
};

// Method to process refund
transactionSchema.methods.processRefund = async function (reason) {
  const Transaction = mongoose.model('Transaction');
  
  const refundTransaction = new Transaction({
    bookingId: this.bookingId,
    userId: this.userId,
    type: 'refund',
    amount: this.amount,
    platformFee: 0,
    status: 'pending',
    originalTransactionId: this._id,
    refundReason: reason,
    gateway: this.gateway,
    currency: this.currency
  });

  await refundTransaction.save();
  
  this.status = 'refunded';
  this.refundedAt = new Date();
  await this.save();
  
  return refundTransaction;
};

// Method to retry failed transaction
transactionSchema.methods.retry = function () {
  if (this.status !== 'failed') {
    throw new Error('Can only retry failed transactions');
  }
  
  this.status = 'pending';
  this.retryCount += 1;
  this.errorCode = undefined;
  this.errorMessage = undefined;
  
  return this.save();
};

// Static method to get transaction summary for a user
transactionSchema.statics.getUserTransactionSummary = async function (userId, startDate, endDate) {
  const matchStage = {
    userId: mongoose.Types.ObjectId(userId),
    status: 'completed'
  };

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalPlatformFee: { $sum: '$platformFee' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get platform revenue
transactionSchema.statics.getPlatformRevenue = async function (startDate, endDate) {
  const matchStage = {
    status: 'completed',
    type: { $in: ['payment', 'penalty'] }
  };

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$platformFee' },
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { totalRevenue: 0, totalTransactions: 0, totalAmount: 0 };
};

// Static method to get pending payouts
transactionSchema.statics.getPendingPayouts = function () {
  return this.find({
    type: 'payout',
    payoutStatus: { $in: ['pending', 'processing'] }
  })
    .populate('userId', 'name email phone')
    .populate('bookingId', 'spotId startTime endTime')
    .sort({ createdAt: 1 });
};

// Static method to reconcile transactions
transactionSchema.statics.reconcile = async function (razorpayPaymentId, razorpayResponse) {
  const transaction = await this.findOne({ razorpayPaymentId });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  transaction.gatewayResponse = razorpayResponse;
  
  if (razorpayResponse.status === 'captured') {
    transaction.status = 'completed';
    transaction.settledAt = new Date();
  } else if (razorpayResponse.status === 'failed') {
    transaction.status = 'failed';
    transaction.errorCode = razorpayResponse.error_code;
    transaction.errorMessage = razorpayResponse.error_description;
  }

  return transaction.save();
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
