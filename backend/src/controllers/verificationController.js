const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');
const { verifyParkingPhoto, batchVerifyPhotos } = require('../services/nyckelService');
const fs = require('fs').promises;

/**
 * @desc    Verify check-in photo
 * @route   POST /api/bookings/:id/verify-checkin
 * @access  Private (Seeker only)
 */
const verifyCheckInPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { notes, location, attemptNumber = 1 } = req.body;

    // Validate attempt number (max 3 attempts)
    if (attemptNumber > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts (3) exceeded. Please contact support.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    // Find booking
    const booking = await Booking.findById(id).populate('spotId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is the seeker
    if (booking.seekerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seeker can verify check-in photos'
      });
    }

    // Check booking status
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify check-in. Booking status is: ${booking.status}`
      });
    }

    // Check if photo was uploaded
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required for verification'
      });
    }

    // Get the uploaded photo
    const photoFile = req.file || req.files[0];

    try {
      // Read the file buffer
      const imageBuffer = await fs.readFile(photoFile.path);

      console.log(`Starting photo verification for booking ${id}, attempt ${attemptNumber}`);

      // Verify photo with Nyckel AI
      const verificationResult = await verifyParkingPhoto(imageBuffer, id);

      // Check if verification passed
      if (verificationResult.isValid) {
        // Upload verified photo to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(photoFile.path, {
          folder: `parkease/bookings/${booking._id}/checkin`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        // Update booking with verified check-in
        booking.status = 'checkedIn';
        booking.checkIn = {
          photos: [uploadResult.secure_url],
          timestamp: new Date(),
          notes: notes || '',
          location: location || null,
          verified: true,
          verificationDetails: {
            confidence: verificationResult.confidence,
            label: verificationResult.label,
            verifiedAt: new Date(),
            attemptNumber
          }
        };

        await booking.save();

        // Clean up temp file
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }

        return res.status(200).json({
          success: true,
          message: 'Photo verified successfully! Check-in complete.',
          data: {
            booking: {
              id: booking._id,
              status: booking.status,
              checkIn: booking.checkIn
            },
            verification: {
              isValid: true,
              confidence: verificationResult.confidence,
              message: 'Photo verification passed'
            }
          }
        });

      } else {
        // Verification failed
        const remainingAttempts = 3 - attemptNumber;

        // Clean up temp file
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }

        return res.status(400).json({
          success: false,
          message: remainingAttempts > 0 
            ? `Photo verification failed. Please take a clearer photo. ${remainingAttempts} attempts remaining.`
            : 'Photo verification failed. Maximum attempts reached.',
          code: 'VERIFICATION_FAILED',
          data: {
            verification: {
              isValid: false,
              confidence: verificationResult.confidence,
              threshold: verificationResult.threshold,
              attemptNumber,
              remainingAttempts,
              reason: verificationResult.confidence < 0.5 
                ? 'Photo is too unclear or does not show a parking spot'
                : 'Photo does not meet verification standards',
              tips: [
                'Ensure good lighting',
                'Take photo from a clear angle',
                'Include the entire parking spot',
                'Avoid blurry or dark images',
                'Match the spot shown in listing photos'
              ]
            }
          }
        });
      }

    } catch (verificationError) {
      console.error('Verification error:', verificationError);

      // Clean up temp file
      try {
        await fs.unlink(photoFile.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }

      // Handle specific verification errors
      if (verificationError.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'Verification service is busy. Please try again in a moment.',
          code: 'RATE_LIMIT'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Photo verification service temporarily unavailable. Please try again.',
        code: 'VERIFICATION_SERVICE_ERROR'
      });
    }

  } catch (error) {
    console.error('Verify check-in photo error:', error);

    // Clean up temp file if it exists
    if (req.file || (req.files && req.files.length > 0)) {
      const photoFile = req.file || req.files[0];
      try {
        await fs.unlink(photoFile.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error processing check-in verification',
      error: error.message
    });
  }
};

/**
 * @desc    Verify check-out photo
 * @route   POST /api/bookings/:id/verify-checkout
 * @access  Private (Seeker only)
 */
const verifyCheckOutPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { notes, location, attemptNumber = 1 } = req.body;

    // Find booking
    const booking = await Booking.findById(id).populate('spotId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user is the seeker
    if (booking.seekerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seeker can verify check-out photos'
      });
    }

    // Check booking status
    if (booking.status !== 'checkedIn') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify check-out. Booking status is: ${booking.status}`
      });
    }

    // Check if photo was uploaded
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required for verification'
      });
    }

    const photoFile = req.file || req.files[0];

    try {
      // Read the file buffer
      const imageBuffer = await fs.readFile(photoFile.path);

      // Verify photo with Nyckel AI
      const verificationResult = await verifyParkingPhoto(imageBuffer, `${id}-checkout`);

      if (verificationResult.isValid) {
        // Upload verified photo to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(photoFile.path, {
          folder: `parkease/bookings/${booking._id}/checkout`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        // Update booking with verified check-out
        booking.status = 'checkedOut';
        booking.checkOut = {
          photos: [uploadResult.secure_url],
          timestamp: new Date(),
          notes: notes || '',
          location: location || null,
          verified: true,
          verificationDetails: {
            confidence: verificationResult.confidence,
            label: verificationResult.label,
            verifiedAt: new Date(),
            attemptNumber
          }
        };

        await booking.save();

        // Clean up temp file
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }

        return res.status(200).json({
          success: true,
          message: 'Photo verified successfully! Check-out complete.',
          data: {
            booking: {
              id: booking._id,
              status: booking.status,
              checkOut: booking.checkOut
            },
            verification: {
              isValid: true,
              confidence: verificationResult.confidence
            }
          }
        });

      } else {
        const remainingAttempts = 3 - attemptNumber;

        // Clean up temp file
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }

        return res.status(400).json({
          success: false,
          message: remainingAttempts > 0
            ? `Photo verification failed. ${remainingAttempts} attempts remaining.`
            : 'Photo verification failed. Maximum attempts reached.',
          code: 'VERIFICATION_FAILED',
          data: {
            verification: {
              isValid: false,
              confidence: verificationResult.confidence,
              attemptNumber,
              remainingAttempts
            }
          }
        });
      }

    } catch (verificationError) {
      console.error('Verification error:', verificationError);

      // Clean up temp file
      try {
        await fs.unlink(photoFile.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }

      return res.status(500).json({
        success: false,
        message: 'Photo verification service error',
        code: 'VERIFICATION_SERVICE_ERROR'
      });
    }

  } catch (error) {
    console.error('Verify check-out photo error:', error);

    res.status(500).json({
      success: false,
      message: 'Error processing check-out verification',
      error: error.message
    });
  }
};

/**
 * @desc    Get verification status for a booking
 * @route   GET /api/bookings/:id/verification-status
 * @access  Private
 */
const getVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user has access
    const isSeeker = booking.seekerId.toString() === userId.toString();
    const isHost = booking.hostId.toString() === userId.toString();

    if (!isSeeker && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const status = {
      bookingId: booking._id,
      status: booking.status,
      checkIn: {
        completed: booking.status !== 'pending' && booking.status !== 'confirmed',
        verified: booking.checkIn?.verified || false,
        timestamp: booking.checkIn?.timestamp || null,
        verificationDetails: booking.checkIn?.verificationDetails || null
      },
      checkOut: {
        completed: ['checkedOut', 'completed'].includes(booking.status),
        verified: booking.checkOut?.verified || false,
        timestamp: booking.checkOut?.timestamp || null,
        verificationDetails: booking.checkOut?.verificationDetails || null
      }
    };

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
};

module.exports = {
  verifyCheckInPhoto,
  verifyCheckOutPhoto,
  getVerificationStatus
};
