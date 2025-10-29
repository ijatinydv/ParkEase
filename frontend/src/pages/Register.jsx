import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdPerson, MdPhone } from 'react-icons/md';
import { FaParking, FaCheckCircle } from 'react-icons/fa';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import authService from '../services/authService';
import { REGEX_PATTERNS, USER_ROLES } from '../utils/constants';

/**
 * Register Page Component
 * Handles new user registration with form validation
 */
const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.SEEKER);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: USER_ROLES.SEEKER,
      agreeToTerms: false,
    },
  });

  // Watch password for validation
  const password = watch('password', '');

  /**
   * Calculate password strength
   * @param {string} pwd - Password to evaluate
   * @returns {Object} Strength level and color
   */
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 'None', color: 'bg-gray-300', width: '0%' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;

    if (strength <= 2) return { level: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 4) return { level: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { level: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(password);

  /**
   * Handle form submission
   * @param {Object} data - Form data
   */
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Prepare user data
      const userData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        role: data.role,
      };

      // Call register service
      await authService.register(userData);

      // Show success message
      toast.success('Registration successful! Please verify your account.', {
        duration: 3000,
        position: 'top-center',
        icon: '🎉',
      });

      // Redirect to OTP verification page
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            email: userData.email,
            fromRegistration: true 
          } 
        });
      }, 500);
    } catch (error) {
      // Handle errors
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg">
              <FaParking className="w-10 h-10 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join ParkEase and start your parking journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Input */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              icon={MdPerson}
              iconPosition="left"
              error={errors.name?.message}
              required
              autoComplete="name"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
                maxLength: {
                  value: 50,
                  message: 'Name must not exceed 50 characters',
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: 'Name can only contain letters and spaces',
                },
              })}
            />

            {/* Email and Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email Input */}
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="your@email.com"
                icon={MdEmail}
                iconPosition="left"
                error={errors.email?.message}
                required
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: REGEX_PATTERNS.EMAIL,
                    message: 'Please enter a valid email address',
                  },
                })}
              />

              {/* Phone Input */}
              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                placeholder="10-digit number"
                icon={MdPhone}
                iconPosition="left"
                error={errors.phone?.message}
                required
                autoComplete="tel"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: REGEX_PATTERNS.PHONE,
                    message: 'Please enter a valid 10-digit phone number',
                  },
                })}
              />
            </div>

            {/* Password Input */}
            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create a strong password"
                icon={MdLock}
                iconPosition="left"
                error={errors.password?.message}
                required
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: REGEX_PATTERNS.PASSWORD,
                    message: 'Password must contain uppercase, lowercase, number and special character',
                  },
                })}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.level === 'Strong' ? 'text-green-600' :
                      passwordStrength.level === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              icon={MdLock}
              iconPosition="left"
              error={errors.confirmPassword?.message}
              required
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Seeker Option */}
                <label
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === USER_ROLES.SEEKER
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={USER_ROLES.SEEKER}
                    className="sr-only"
                    {...register('role', { required: 'Please select a role' })}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔍</div>
                    <div className="font-medium text-gray-900">Find Parking</div>
                    <div className="text-xs text-gray-500">Seeker</div>
                  </div>
                  {selectedRole === USER_ROLES.SEEKER && (
                    <FaCheckCircle className="absolute top-2 right-2 text-blue-600 w-5 h-5" />
                  )}
                </label>

                {/* Host Option */}
                <label
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === USER_ROLES.HOST
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={USER_ROLES.HOST}
                    className="sr-only"
                    {...register('role')}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏠</div>
                    <div className="font-medium text-gray-900">List Space</div>
                    <div className="text-xs text-gray-500">Host</div>
                  </div>
                  {selectedRole === USER_ROLES.HOST && (
                    <FaCheckCircle className="absolute top-2 right-2 text-blue-600 w-5 h-5" />
                  )}
                </label>

                {/* Both Option */}
                <label
                  className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === USER_ROLES.BOTH
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={USER_ROLES.BOTH}
                    className="sr-only"
                    {...register('role')}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">🤝</div>
                    <div className="font-medium text-gray-900">Both</div>
                    <div className="text-xs text-gray-500">Find & List</div>
                  </div>
                  {selectedRole === USER_ROLES.BOTH && (
                    <FaCheckCircle className="absolute top-2 right-2 text-blue-600 w-5 h-5" />
                  )}
                </label>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  {...register('agreeToTerms', {
                    required: 'You must accept the terms and conditions',
                  })}
                />
              </div>
              <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:underline font-medium">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
