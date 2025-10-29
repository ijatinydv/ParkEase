const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configure multer storage
 * Using disk storage to save files temporarily before uploading to Cloudinary
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter function to validate file types
 * Only allow image files
 */
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  // Check MIME type
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    // Reject file with error
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG, JPG, PNG, and WebP images are allowed.`
      ),
      false
    );
  }
};

/**
 * Additional file validation function
 * Can be used as middleware to check file size and dimensions after upload
 */
const validateImage = (file) => {
  const errors = [];

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    errors.push(`File ${file.originalname} exceeds 5MB size limit`);
  }

  // Check minimum file size (10KB)
  const minSize = 10 * 1024; // 10KB in bytes
  if (file.size < minSize) {
    errors.push(`File ${file.originalname} is too small (minimum 10KB)`);
  }

  return errors;
};

/**
 * Multer configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Maximum 10 files per request
  }
});

/**
 * Error handling middleware for multer errors
 * Use this after the upload middleware to catch and format errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the 5MB limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected field name: ${err.field}`;
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the multipart form';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = err.message;
    }

    return res.status(400).json({
      success: false,
      message: message,
      error: err.code
    });
  } else if (err) {
    // Other errors (like file type validation)
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      error: err.name
    });
  }
  
  next();
};

/**
 * Middleware to validate uploaded images
 * Use after multer upload middleware
 */
const validateUploadedImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    // No files uploaded - let the controller handle this
    return next();
  }

  const errors = [];
  
  // Validate each uploaded file
  req.files.forEach(file => {
    const fileErrors = validateImage(file);
    errors.push(...fileErrors);
  });

  if (errors.length > 0) {
    // Clean up uploaded files
    req.files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    });

    return res.status(400).json({
      success: false,
      message: 'Image validation failed',
      errors: errors
    });
  }

  next();
};

/**
 * Middleware to clean up temporary files after request
 * Use this as the last middleware in routes that upload files
 */
const cleanupTempFiles = (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;

  // Override res.json to clean up files after response
  res.json = function (data) {
    // Clean up temporary files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error('Error cleaning up temp file:', err);
          }
        });
      });
    }

    // Call original res.json
    originalJson.call(this, data);
  };

  next();
};

/**
 * Utility function to delete a file
 */
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Utility function to clean up all files in temp directory
 */
const cleanupTempDirectory = () => {
  const uploadDir = path.join(__dirname, '../../uploads/temp');
  
  if (fs.existsSync(uploadDir)) {
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('Error reading temp directory:', err);
        return;
      }

      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error('Error getting file stats:', err);
            return;
          }

          // Delete files older than 1 hour
          const now = Date.now();
          const fileAge = now - stats.mtimeMs;
          const oneHour = 60 * 60 * 1000;

          if (fileAge > oneHour) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting old temp file:', err);
              } else {
                console.log(`Deleted old temp file: ${file}`);
              }
            });
          }
        });
      });
    });
  }
};

// Run cleanup every hour
setInterval(cleanupTempDirectory, 60 * 60 * 1000);

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.validateUploadedImages = validateUploadedImages;
module.exports.cleanupTempFiles = cleanupTempFiles;
module.exports.deleteFile = deleteFile;
