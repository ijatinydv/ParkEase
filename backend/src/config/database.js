const mongoose = require('mongoose');
const colors = require('colors');

/**
 * Connect to MongoDB Database
 * Handles both local and cloud (MongoDB Atlas) connections
 */
const connectDB = async () => {
  try {
    // MongoDB connection options for better performance and reliability
    const options = {
      // Use new URL parser
      useNewUrlParser: true,
      // Use unified topology for better connection management
      useUnifiedTopology: true,
      // Automatically create indexes
      autoIndex: true,
      // Maximum number of sockets the MongoDB driver will keep open
      maxPoolSize: 10,
      // Keep trying to send operations for 5 seconds
      serverSelectionTimeoutMS: 5000,
      // Close sockets after 45 seconds of inactivity
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );

    // Log database name
    console.log(`Database Name: ${conn.connection.name}`.cyan);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB'.green);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose connection error: ${err}`.red);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB'.yellow);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination'.yellow);
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    console.error('Failed to connect to MongoDB. Please check your connection string and network.'.red);
    process.exit(1);
  }
};

module.exports = connectDB;
