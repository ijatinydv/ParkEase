const cloudinary = require('cloudinary').v2;
const colors = require('colors');

/**
 * Configure Cloudinary for image upload and storage
 * Documentation: https://cloudinary.com/documentation/node_integration
 */
const configureCloudinary = () => {
  try {
    // Configure Cloudinary with credentials from environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS for all URLs
    });

    console.log('Cloudinary configured successfully'.green);

    // Verify configuration (optional - can be commented out in production)
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.warn(
        'Warning: Cloudinary credentials not properly set in environment variables'.yellow
      );
    }

    return cloudinary;
  } catch (error) {
    console.error(`Cloudinary configuration error: ${error.message}`.red);
    throw error;
  }
};

/**
 * Upload options for different file types
 */
const uploadOptions = {
  // Options for parking spot images
  parkingSpot: {
    folder: 'parkease/parking-spots',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },

  // Options for user profile images
  profile: {
    folder: 'parkease/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },

  // Options for verification images (check-in/check-out)
  verification: {
    folder: 'parkease/verifications',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },

  // Options for review images
  review: {
    folder: 'parkease/reviews',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
};

module.exports = {
  cloudinary: configureCloudinary(),
  uploadOptions,
};
