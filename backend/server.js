const dotenv = require('dotenv');
const colors = require('colors');
const app = require('./src/app');
const connectDB = require('./src/config/database');

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// DATABASE CONNECTION
// ============================================

// Connect to MongoDB
connectDB();

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  console.log('==========================================='.cyan);
  console.log(`🚀 ParkEase API Server`.green.bold);
  console.log('==========================================='.cyan);
  console.log(`Environment: ${NODE_ENV}`.yellow);
  console.log(`Server running on port: ${PORT}`.yellow);
  console.log(`Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`.yellow);
  console.log('==========================================='.cyan);
});

// ============================================
// HANDLE UNHANDLED REJECTIONS
// ============================================

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`.red.bold);
  console.error(err);
  
  // Close server & exit process
  console.log('Shutting down server due to unhandled rejection...'.red);
  server.close(() => {
    process.exit(1);
  });
});

// ============================================
// HANDLE UNCAUGHT EXCEPTIONS
// ============================================

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`.red.bold);
  console.error(err);
  
  // Exit process
  console.log('Shutting down server due to uncaught exception...'.red);
  process.exit(1);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Handle SIGTERM signal (e.g., from Docker, Kubernetes)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server'.yellow);
  server.close(() => {
    console.log('HTTP server closed'.yellow);
    process.exit(0);
  });
});

// Handle SIGINT signal (e.g., Ctrl+C in terminal)
process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server'.yellow);
  server.close(() => {
    console.log('HTTP server closed'.yellow);
    process.exit(0);
  });
});

module.exports = server;
