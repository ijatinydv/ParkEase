import apiService from './api';

/**
 * Verification Service
 * Handles photo verification for check-in and check-out
 */

const verificationService = {
  /**
   * Verify check-in photo
   * @param {string} bookingId - Booking ID
   * @param {File} imageFile - Photo file from camera/upload
   * @param {Object} options - Additional options (notes, location, attemptNumber)
   * @returns {Promise<Object>} Verification result
   */
  verifyPhoto: async (bookingId, imageFile, options = {}) => {
    try {
      const { notes = '', location = null, attemptNumber = 1, type = 'checkin' } = options;

      // Validate file
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('Invalid image file');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (imageFile.size > maxSize) {
        throw new Error('Image file is too large. Maximum size is 10MB.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('photo', imageFile);
      formData.append('notes', notes);
      formData.append('attemptNumber', attemptNumber.toString());

      if (location && location.lat && location.lng) {
        formData.append('location', JSON.stringify(location));
      }

      // Determine endpoint
      const endpoint = type === 'checkout' 
        ? `/bookings/${bookingId}/verify-checkout`
        : `/bookings/${bookingId}/verify-checkin`;

      // Upload and verify
      const response = await apiService.upload(endpoint, formData);

      return {
        success: true,
        data: response.data,
        message: response.message
      };

    } catch (error) {
      console.error('Verification error:', error);
      
      // Handle specific error cases
      if (error.code === 'VERIFICATION_FAILED') {
        return {
          success: false,
          code: 'VERIFICATION_FAILED',
          message: error.message,
          data: error.data
        };
      }

      if (error.code === 'MAX_ATTEMPTS_EXCEEDED') {
        return {
          success: false,
          code: 'MAX_ATTEMPTS_EXCEEDED',
          message: error.message
        };
      }

      throw error;
    }
  },

  /**
   * Get verification status for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Verification status
   */
  getVerificationStatus: async (bookingId) => {
    try {
      const response = await apiService.get(`/bookings/${bookingId}/verification-status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  },

  /**
   * Compress image before upload
   * @param {File} file - Original image file
   * @param {Object} options - Compression options
   * @returns {Promise<File>} Compressed image file
   */
  compressImage: async (file, options = {}) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validate image quality before verification
   * @param {File} file - Image file to validate
   * @returns {Promise<Object>} Validation result
   */
  validateImageQuality: async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const warnings = [];
          const { width, height, naturalWidth, naturalHeight } = img;

          // Check minimum resolution
          if (width < 640 || height < 480) {
            warnings.push('Image resolution is low. Photo may not verify successfully.');
          }

          // Check aspect ratio (should be reasonable)
          const aspectRatio = width / height;
          if (aspectRatio < 0.5 || aspectRatio > 2) {
            warnings.push('Unusual image dimensions. Try capturing from a different angle.');
          }

          resolve({
            valid: warnings.length === 0,
            warnings,
            dimensions: { width, height, naturalWidth, naturalHeight }
          });
        };

        img.onerror = () => {
          resolve({
            valid: false,
            warnings: ['Could not read image file. Please try another photo.']
          });
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        resolve({
          valid: false,
          warnings: ['Failed to read file. Please try again.']
        });
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Get current location for verification
   * @returns {Promise<Object>} { lat, lng }
   */
  getCurrentLocation: async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'Could not get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          
          reject(new Error(message));
        },
        options
      );
    });
  }
};

export default verificationService;
