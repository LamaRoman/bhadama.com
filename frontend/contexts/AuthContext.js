'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/utils/api';

const AuthContext = createContext(undefined);

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
    console.log('🔍 AuthContext: Loading user from localStorage...');
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('🔍 Token exists:', !!token);
    console.log('🔍 Stored user:', storedUser);

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Parsed user:', parsedUser);
        console.log('📧 emailVerified:', parsedUser.emailVerified);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Refresh user data from backend
  const refreshUser = async () => {
    try {
      const response = await api('/api/auth/me', {
        method: 'GET',
      });
      const updatedUser = response.user || response;
      
      // Update state
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('✅ User data refreshed');
      return updatedUser;
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);
      // If token is invalid, logout
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
      }
      throw error;
    }
  };

  // Regular email/password login
  const login = async (email, password) => {
    try {
      console.log('🔐 Login called with:', { email, password });
      const response = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      const { token, user: userData } = response;

      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      throw error;
    }
  };

  // OAuth login (for Google, Facebook, etc.)
  const loginWithOAuth = (userData, token) => {
    try {
      console.log('🔐 OAuth Login called with:', { userData, token });
      
      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      console.log('✅ OAuth login successful');
      return userData;
    } catch (error) {
      console.error('❌ OAuth login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Update user locally (without API call)
  const updateUser = (updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    loginWithOAuth,
    logout,
    refreshUser,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};