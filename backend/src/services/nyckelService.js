const axios = require('axios');

/**
 * Nyckel Service - AI Photo Verification
 * Verifies parking spot photos using Nyckel's image classification API
 */

const NYCKEL_API_URL = process.env.NYCKEL_API_URL || 'https://www.nyckel.com/v1';
const NYCKEL_API_KEY = process.env.NYCKEL_API_KEY;
const NYCKEL_FUNCTION_ID = process.env.NYCKEL_FUNCTION_ID; // Your trained function ID

// Minimum confidence threshold (85%)
const CONFIDENCE_THRESHOLD = parseFloat(process.env.NYCKEL_CONFIDENCE_THRESHOLD) || 0.85;

/**
 * Verify parking photo using Nyckel API
 * @param {Buffer|string} imageInput - Image buffer or base64 string or URL
 * @param {string} bookingId - Booking ID for logging
 * @returns {Promise<Object>} { isValid, confidence, label, details }
 */
const verifyParkingPhoto = async (imageInput, bookingId = null) => {
  try {
    if (!NYCKEL_API_KEY) {
      console.error('Nyckel API key not configured');
      throw new Error('Photo verification service is not configured');
    }

    if (!NYCKEL_FUNCTION_ID) {
      console.error('Nyckel Function ID not configured');
      throw new Error('Photo verification function not configured');
    }

    // Prepare the request payload
    let requestData = {};
    
    if (Buffer.isBuffer(imageInput)) {
      // Convert buffer to base64
      const base64Image = imageInput.toString('base64');
      requestData = {
        data: `data:image/jpeg;base64,${base64Image}`
      };
    } else if (typeof imageInput === 'string') {
      // Assume it's a URL or base64 string
      if (imageInput.startsWith('http')) {
        requestData = { data: imageInput };
      } else {
        requestData = { data: imageInput };
      }
    } else {
      throw new Error('Invalid image input format');
    }

    console.log(`Verifying photo for booking: ${bookingId || 'unknown'}`);

    // Call Nyckel API
    const response = await axios.post(
      `${NYCKEL_API_URL}/functions/${NYCKEL_FUNCTION_ID}/invoke`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${NYCKEL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // Parse Nyckel response
    // Expected format: { labelName: "valid_parking", confidence: 0.92 }
    const { labelName, confidence } = response.data;

    const isValid = confidence >= CONFIDENCE_THRESHOLD && 
                    (labelName === 'valid_parking' || labelName === 'parking_spot');

    const result = {
      isValid,
      confidence: parseFloat(confidence.toFixed(4)),
      label: labelName,
      threshold: CONFIDENCE_THRESHOLD,
      details: {
        timestamp: new Date().toISOString(),
        bookingId,
        rawResponse: response.data
      }
    };

    console.log(`Photo verification result: ${isValid ? 'VALID' : 'INVALID'} (confidence: ${result.confidence})`);

    return result;

  } catch (error) {
    console.error('Nyckel verification error:', error.message);
    
    // Handle specific errors
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        throw new Error('Invalid API credentials for photo verification');
      } else if (status === 404) {
        throw new Error('Photo verification function not found');
      } else if (status === 429) {
        throw new Error('Photo verification rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Photo verification failed: ${data.message || 'Unknown error'}`);
      }
    }

    // Network or other errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Photo verification timeout. Please try again.');
    }

    throw new Error(`Photo verification service error: ${error.message}`);
  }
};

/**
 * Batch verify multiple photos
 * @param {Array} images - Array of image inputs
 * @param {string} bookingId - Booking ID for logging
 * @returns {Promise<Object>} { allValid, results, averageConfidence }
 */
const batchVerifyPhotos = async (images, bookingId = null) => {
  try {
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided for verification');
    }

    console.log(`Batch verifying ${images.length} photos for booking: ${bookingId || 'unknown'}`);

    // Verify all photos in parallel
    const verificationPromises = images.map((image, index) => 
      verifyParkingPhoto(image, `${bookingId}-photo-${index + 1}`)
    );

    const results = await Promise.all(verificationPromises);

    // Calculate overall validity
    const allValid = results.every(result => result.isValid);
    const validCount = results.filter(result => result.isValid).length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      allValid,
      validCount,
      totalCount: results.length,
      averageConfidence: parseFloat(averageConfidence.toFixed(4)),
      results,
      passed: allValid || (validCount / results.length) >= 0.6 // At least 60% must be valid
    };

  } catch (error) {
    console.error('Batch verification error:', error.message);
    throw error;
  }
};

/**
 * Compare check-in and check-out photos
 * This can be used to verify the parking spot condition
 * @param {string} checkInPhoto - Check-in photo URL or buffer
 * @param {string} checkOutPhoto - Check-out photo URL or buffer
 * @returns {Promise<Object>} Comparison result
 */
const comparePhotos = async (checkInPhoto, checkOutPhoto) => {
  try {
    // Verify both photos independently
    const [checkInResult, checkOutResult] = await Promise.all([
      verifyParkingPhoto(checkInPhoto, 'checkin-comparison'),
      verifyParkingPhoto(checkOutPhoto, 'checkout-comparison')
    ]);

    const bothValid = checkInResult.isValid && checkOutResult.isValid;
    const confidenceDiff = Math.abs(checkInResult.confidence - checkOutResult.confidence);

    return {
      bothValid,
      checkIn: checkInResult,
      checkOut: checkOutResult,
      confidenceDifference: parseFloat(confidenceDiff.toFixed(4)),
      suspicious: confidenceDiff > 0.3, // Large difference might indicate different locations
      assessment: bothValid 
        ? 'Both photos verified successfully' 
        : 'One or more photos failed verification'
    };

  } catch (error) {
    console.error('Photo comparison error:', error.message);
    throw error;
  }
};

/**
 * Health check for Nyckel service
 * @returns {Promise<Object>} Service health status
 */
const checkServiceHealth = async () => {
  try {
    if (!NYCKEL_API_KEY || !NYCKEL_FUNCTION_ID) {
      return {
        healthy: false,
        configured: false,
        message: 'Nyckel service not configured'
      };
    }

    // Try to invoke the function with a test request
    const response = await axios.get(
      `${NYCKEL_API_URL}/functions/${NYCKEL_FUNCTION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${NYCKEL_API_KEY}`
        },
        timeout: 5000
      }
    );

    return {
      healthy: true,
      configured: true,
      functionId: NYCKEL_FUNCTION_ID,
      message: 'Nyckel service is operational',
      details: response.data
    };

  } catch (error) {
    return {
      healthy: false,
      configured: true,
      message: error.message,
      error: error.response?.data || error.message
    };
  }
};

module.exports = {
  verifyParkingPhoto,
  batchVerifyPhotos,
  comparePhotos,
  checkServiceHealth,
  CONFIDENCE_THRESHOLD
};
