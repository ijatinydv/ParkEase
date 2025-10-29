import { createContext, useContext, useState, useEffect } from 'react';
import authService from '@services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize auth state from localStorage
   */
  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = authService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        // Verify token by fetching current user
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear auth state
          handleLogout();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);

      setUser(response.user);
      setToken(response.token);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return { success: true, user: response.user };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);

      setUser(response.user);
      setToken(response.token);
      setIsAuthenticated(true);

      toast.success('Registration successful!');
      return { success: true, user: response.user };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
      handleLogout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      handleLogout();
    }
  };

  /**
   * Handle logout cleanup
   */
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updateData) => {
    try {
      const updatedUser = await authService.updateProfile(updateData);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
