import { REGEX_PATTERNS } from './constants';

/**
 * Validation utilities
 */
export const validators = {
  /**
   * Validate email
   */
  email: (email) => {
    if (!email) return 'Email is required';
    if (!REGEX_PATTERNS.EMAIL.test(email)) return 'Invalid email format';
    return null;
  },

  /**
   * Validate password
   */
  password: (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return null;
  },

  /**
   * Validate phone number
   */
  phone: (phone) => {
    if (!phone) return 'Phone number is required';
    if (!REGEX_PATTERNS.PHONE.test(phone)) return 'Invalid phone number';
    return null;
  },

  /**
   * Validate required field
   */
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validate min length
   */
  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Validate max length
   */
  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  },

  /**
   * Validate number range
   */
  range: (value, min, max, fieldName = 'This field') => {
    const num = Number(value);
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  /**
   * Validate URL
   */
  url: (url) => {
    if (!url) return null;
    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },

  /**
   * Validate date
   */
  date: (date) => {
    if (!date) return 'Date is required';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return null;
  },

  /**
   * Validate future date
   */
  futureDate: (date) => {
    const error = validators.date(date);
    if (error) return error;
    
    const dateObj = new Date(date);
    if (dateObj < new Date()) return 'Date must be in the future';
    return null;
  },

  /**
   * Validate file size
   */
  fileSize: (file, maxSize) => {
    if (!file) return 'File is required';
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / 1024 / 1024}MB`;
    }
    return null;
  },

  /**
   * Validate file type
   */
  fileType: (file, allowedTypes) => {
    if (!file) return 'File is required';
    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
  },
};

export default validators;
