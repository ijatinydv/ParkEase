const Razorpay = require('razorpay');
const colors = require('colors');

/**
 * Initialize Razorpay instance for payment processing
 * Documentation: https://razorpay.com/docs/api/
 */
let razorpayInstance = null;

const configureRazorpay = () => {
  try {
    // Verify that Razorpay credentials are provided
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn(
        'Warning: Razorpay credentials not set. Payment features will not work.'.yellow
      );
      return null;
    }

    // Create Razorpay instance
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('Razorpay configured successfully'.green);

    return razorpayInstance;
  } catch (error) {
    console.error(`Razorpay configuration error: ${error.message}`.red);
    throw error;
  }
};

/**
 * Get Razorpay instance
 * @returns {Razorpay} Razorpay instance
 */
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    razorpayInstance = configureRazorpay();
  }
  return razorpayInstance;
};

/**
 * Payment configuration constants
 */
const paymentConfig = {
  // Currency for all transactions
  currency: 'INR',

  // Payment methods to accept
  paymentMethods: {
    card: true,
    netbanking: true,
    wallet: true,
    upi: true,
    emi: false,
  },

  // Order receipt prefix
  receiptPrefix: 'PARKEASE_',

  // Platform fee percentage (can be overridden by env variable)
  platformFeePercentage: parseInt(process.env.PLATFORM_FEE_PERCENTAGE) || 10,

  // Minimum amount for payment (in paise for INR, i.e., 100 paise = 1 INR)
  minAmount: 100, // 1 INR

  // Maximum amount for payment (in paise)
  maxAmount: 10000000, // 100,000 INR

  // Payment capture setting
  autoCapture: true, // Automatically capture payments

  // Payment timeout (in seconds)
  timeout: 900, // 15 minutes
};

/**
 * Generate unique receipt ID for Razorpay orders
 * @returns {string} Unique receipt ID
 */
const generateReceiptId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${paymentConfig.receiptPrefix}${timestamp}_${random}`;
};

/**
 * Convert amount to smallest currency unit (paise for INR)
 * @param {number} amount - Amount in rupees
 * @returns {number} Amount in paise
 */
const convertToPaise = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Convert amount from smallest currency unit to main unit
 * @param {number} paise - Amount in paise
 * @returns {number} Amount in rupees
 */
const convertToRupees = (paise) => {
  return parseFloat((paise / 100).toFixed(2));
};

module.exports = {
  razorpay: configureRazorpay(),
  getRazorpayInstance,
  paymentConfig,
  generateReceiptId,
  convertToPaise,
  convertToRupees,
};
