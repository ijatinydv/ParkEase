import { get, post, put, del } from './api';

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

// Register new user
export const register = async (userData) => {
  return await post('/auth/register', userData);
};

// Login user
export const login = async (credentials) => {
  return await post('/auth/login', credentials);
};

// Logout user
export const logout = async () => {
  return await post('/auth/logout');
};

// Get current user
export const getCurrentUser = async () => {
  return await get('/auth/me');
};

// Forgot password
export const forgotPassword = async (email) => {
  return await post('/auth/forgot-password', { email });
};

// Reset password
export const resetPassword = async (token, password) => {
  return await put(`/auth/reset-password/${token}`, { password });
};

// Update password
export const updatePassword = async (currentPassword, newPassword) => {
  return await put('/auth/update-password', { currentPassword, newPassword });
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updatePassword,
};
