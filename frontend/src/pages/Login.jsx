import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdEmail, MdLock } from 'react-icons/md';
import { FaParking } from 'react-icons/fa';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import authService from '../services/authService';
import { REGEX_PATTERNS } from '../utils/constants';

/**
 * Login Page Component
 * Handles user authentication with email and password
 */
const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Handle form submission
   * @param {Object} data - Form data
   */
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Call login service
      await authService.login(data.email, data.password);

      // Show success message
      toast.success('Login successful! Welcome back.', {
        duration: 3000,
        position: 'top-center',
        icon: '🎉',
      });

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      // Handle errors
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg">
              <FaParking className="w-10 h-10 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your ParkEase account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="Enter your email"
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

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              icon={MdLock}
              iconPosition="left"
              error={errors.password?.message}
              required
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
