const User = require('../models/User');
const { generateAccessToken, generateResetToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // 1. Extract user data from request body
    const { name, email, phone, password, role } = req.body;

    // 2. Check if user already exists with the email or phone
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        field: 'email'
      });
    }

    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this phone number',
        field: 'phone'
      });
    }

    // 3. Create user object with provided data
    const userData = {
      name,
      email,
      phone,
      password, // Will be hashed automatically by pre-save hook in User model
      role: role || 'seeker' // Default to 'seeker' if not provided
    };

    // 4. Create new user in database
    const user = await User.create(userData);

    // 5. Generate JWT access token
    const token = generateAccessToken(user);

    // 6. Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // 7. Send success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toPublicProfile(), // Remove sensitive data like password
        token
      }
    });

  } catch (error) {
    console.error('Register Error:', error);

    // Handle MongoDB duplicate key error (fallback in case unique index catches it)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `User already exists with this ${field}`,
        field
      });
    }

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // 1. Extract credentials from request body
    const { email, password } = req.body;

    // 2. Find user by email and include password field
    // (password is excluded by default via select: false in model)
    const user = await User.findOne({ email }).select('+password');

    // 3. Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 5. Verify password using the comparePassword method from User model
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 6. Generate JWT access token
    const token = generateAccessToken(user);

    // 7. Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // 8. Remove password from user object before sending response
    user.password = undefined;

    // 9. Send success response with user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 */
const getMe = async (req, res) => {
  try {
    // 1. User is already attached to req.user by protect middleware
    // 2. Fetch fresh user data from database (in case of updates)
    const user = await User.findById(req.user.id).select('-password');

    // 3. Check if user still exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 4. Send user data in response
    res.status(200).json({
      success: true,
      data: {
        user: user.toPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data.'
    });
  }
};

/**
 * @desc    Forgot password - Send reset token to email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    // 1. Extract email from request body
    const { email } = req.body;

    // 2. Find user by email
    const user = await User.findOne({ email });

    // 3. Always return success message (security best practice)
    // This prevents email enumeration attacks
    const successMessage = 'If an account exists with this email, a password reset link has been sent.';

    // If user doesn't exist, still return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: successMessage,
        data: { email }
      });
    }

    // 4. Check if account is active
    if (!user.isActive) {
      // Still return success message for security
      return res.status(200).json({
        success: true,
        message: successMessage,
        data: { email }
      });
    }

    // 5. Generate password reset token (short-lived, 15 minutes)
    const resetToken = generateResetToken(user);

    // 6. Create reset URL for email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 7. Email configuration and sending
    // TODO: Implement actual email sending using nodemailer
    // For now, we'll log the reset URL (development only)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=================================');
      console.log('PASSWORD RESET EMAIL');
      console.log('=================================');
      console.log(`To: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token expires in: ${process.env.JWT_RESET_EXPIRE || '15m'}`);
      console.log('=================================\n');
    }

    // Placeholder for email sending service
    try {
      // await sendPasswordResetEmail(user.email, user.name, resetUrl);
      
      // Temporary: In production, replace this with actual email sending
      // Example with nodemailer:
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Password Reset Request - ParkEase',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in ${process.env.JWT_RESET_EXPIRE || '15 minutes'}.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Thanks,<br>ParkEase Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
      */

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Don't reveal email sending failure to user (security)
      // Just log it server-side and still return success
    }

    // 8. Send success response
    res.status(200).json({
      success: true,
      message: successMessage,
      data: { email }
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset request.'
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    // 1. Extract token and new password from request body
    const { token, newPassword } = req.body;

    // 2. Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Handle token verification errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Reset token has expired. Please request a new one.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // 3. Check if token is a reset token (not an access token)
    if (decoded.type !== 'reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type. Please use a password reset token.'
      });
    }

    // 4. Find user by ID from token
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 5. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 6. Check if new password is different from old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password'
      });
    }

    // 7. Update password (will be hashed automatically by pre-save hook)
    user.password = newPassword;
    await user.save();

    // 8. Log password reset event
    console.log(`Password reset successful for user: ${user.email} at ${new Date().toISOString()}`);

    // 9. Send success response
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
      data: null
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password. Please try again later.'
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private (requires authentication)
 */
const logout = async (req, res) => {
  try {
    // Note: With JWT, logout is primarily handled on the client side
    // by removing the token from localStorage/cookies
    
    // Optional: If implementing token blacklist in future
    // Add current token to blacklist/revocation list in Redis/DB
    
    // Optional: Clear httpOnly cookie if using cookie-based auth
    // res.cookie('token', 'none', {
    //   expires: new Date(Date.now() + 10 * 1000),
    //   httpOnly: true
    // });

    // Log logout event
    console.log(`User logged out: ${req.user.email} at ${new Date().toISOString()}`);

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout.'
    });
  }
};

/**
 * @desc    Update password (for authenticated users)
 * @route   PUT /api/auth/update-password
 * @access  Private (requires authentication)
 */
const updatePassword = async (req, res) => {
  try {
    // 1. Extract passwords from request body
    const { currentPassword, newPassword } = req.body;

    // 2. Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 3. Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // 4. Update to new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // 5. Generate new token (invalidates old one for extra security)
    const token = generateAccessToken(user);

    // 6. Log password change event
    console.log(`Password updated for user: ${user.email} at ${new Date().toISOString()}`);

    // 7. Send success response with new token
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: { token }
    });

  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
  updatePassword
};
