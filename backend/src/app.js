const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security headers with Helmet
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Enable CORS with specific origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ============================================
// RATE LIMITING
// ============================================

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Special handling for Razorpay webhook - must receive raw body for signature verification
// This must come BEFORE the JSON parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // In production, use a more concise format
  app.use(morgan('combined'));
}

// ============================================
// COMPRESSION MIDDLEWARE
// ============================================

// Compress all responses
app.use(compression());

// ============================================
// ROUTES
// ============================================

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParkEase API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// IMPORT ROUTES
// ============================================

const authRoutes = require('./routes/auth');
const spotRoutes = require('./routes/spots');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
// const userRoutes = require('./routes/user');

// ============================================
// MOUNT ROUTES
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Parking spots routes
app.use('/api/spots', spotRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Payment routes (Razorpay integration)
app.use('/api/payments', paymentRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Other routes (uncomment as you create them)
// app.use('/api/users', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Route not found
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler middleware
app.use((err, req, res, next) => {
  // Set default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    statusCode: err.statusCode,
    // Only send stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
