import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('emoticon_token');
        const savedUser = localStorage.getItem('emoticon_user');
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Validate token by fetching profile
          try {
            const response = await apiService.getProfile();
            if (response.data.success) {
              setUser({
                ...userData,
                ...response.data.user
              });
            } else {
              throw new Error('Invalid profile response');
            }
          } catch (error) {
            // Token is invalid, clear stored data
            localStorage.removeItem('emoticon_token');
            localStorage.removeItem('emoticon_user');
            console.log('Token validation failed, user logged out');
          }
        } else {
          // No token - user is not logged in, which is fine for guest access
          console.log('No authentication token found - continuing as guest');
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });
      
      if (response.data.success) {
        const { user: userData, token } = response.data.user;
        
        // Store user data and token
        localStorage.setItem('emoticon_token', token);
        localStorage.setItem('emoticon_user', JSON.stringify(userData));
        
        // Fetch full profile
        const profileResponse = await apiService.getProfile();
        if (profileResponse.data.success) {
          setUser(profileResponse.data.user);
        } else {
          setUser(userData);
        }
        
        toast.success('Welcome back! 🎉');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiService.register({ email, password });
      
      if (response.data.success) {
        const { user: userData, token } = response.data.user;
        
        // Store user data and token
        localStorage.setItem('emoticon_token', token);
        localStorage.setItem('emoticon_user', JSON.stringify(userData));
        
        // Fetch full profile
        const profileResponse = await apiService.getProfile();
        if (profileResponse.data.success) {
          setUser(profileResponse.data.user);
        } else {
          setUser(userData);
        }
        
        toast.success('Account created successfully! Welcome to Emoticon! 🎭');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }
    
    // Clear user data
    localStorage.removeItem('emoticon_token');
    localStorage.removeItem('emoticon_user');
    setUser(null);
    
    toast.success('Logged out successfully');
  };

  const refreshProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.data.success) {
        setUser(response.data.user);
        
        // Update localStorage
        localStorage.setItem('emoticon_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};