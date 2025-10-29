import apiService from './api';

const authService = {
  /**
   * Login user with email and password
   */
  login: async (email, password) => {
    const response = await apiService.post('/auth/login', { email, password });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Logout current user
   */
  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    const response = await apiService.get('/auth/me');
    
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response.user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (updateData) => {
    const response = await apiService.put('/auth/profile', updateData);
    
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response.user;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return await apiService.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    return await apiService.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    return await apiService.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Get stored user
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
