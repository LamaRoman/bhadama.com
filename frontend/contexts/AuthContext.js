// contexts/AuthContext.js
// ==========================================
// SECURE AUTH CONTEXT
// ==========================================
// Features:
// 1. Dual token storage (access + refresh)
// 2. Automatic token refresh
// 3. Session management
// 4. Handles locked/suspended accounts
// ==========================================

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  api, 
  setTokens, 
  clearTokens, 
  getAccessToken,
  ApiError,
  AuthError,
  RateLimitError,
  getErrorMessage,
  shouldLogout 
} from '@/utils/api';

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
  const [sessionError, setSessionError] = useState(null);

  // ==========================================
  // INITIALIZATION
  // ==========================================

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing...');
    
    const token = getAccessToken();
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ User loaded from storage:', parsedUser.email);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        clearTokens();
      }
    }
    
    setLoading(false);
  }, []);

  // ==========================================
  // LISTEN FOR AUTH EVENTS
  // ==========================================

  useEffect(() => {
    const handleLogout = (event) => {
      console.log('🔒 Auth logout event:', event.detail?.reason);
      logout();
      setSessionError(event.detail?.reason || 'SESSION_EXPIRED');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password, rememberMe },
      });

      const { accessToken, refreshToken, token, user: userData } = response;

      // Store tokens (handle both new and legacy response formats)
      setTokens(accessToken || token, refreshToken);

      // Store user
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionError(null);

      console.log('✅ Login successful:', userData.email);
      return userData;
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Enhance error with user-friendly message
      if (error instanceof ApiError) {
        error.userMessage = getErrorMessage(error);
      }
      
      throw error;
    }
  };

  // ==========================================
  // OAUTH LOGIN (Google, etc.)
  // ==========================================

  const loginWithOAuth = (userData, accessToken, refreshToken = null) => {
    try {
      console.log('🔐 OAuth login...');

      // Store tokens
      setTokens(accessToken, refreshToken);

      // Store user
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionError(null);

      console.log('✅ OAuth login successful:', userData.email);
      return userData;
    } catch (error) {
      console.error('❌ OAuth login failed:', error);
      throw error;
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(async (callApi = true) => {
    console.log('🚪 Logging out...');

    // Call logout API if requested (to invalidate server session)
    if (callApi) {
      try {
        await api('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignore logout API errors
        console.warn('Logout API call failed:', error.message);
      }
    }

    // Clear local storage
    clearTokens();
    setUser(null);

    console.log('✅ Logged out');
  }, []);

  // ==========================================
  // REFRESH USER DATA
  // ==========================================

  const refreshUser = async () => {
    try {
      const response = await api('/api/auth/me', { method: 'GET' });
      const updatedUser = response.user || response;

      // Update state and storage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ User data refreshed');
      return updatedUser;
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);

      // If auth error, logout
      if (shouldLogout(error)) {
        logout(false);
      }

      throw error;
    }
  };

  // ==========================================
  // UPDATE USER (Local only)
  // ==========================================

  const updateUser = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const register = async (formData) => {
    try {
      console.log('📝 Attempting registration...');

      const response = await api('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const { accessToken, refreshToken, token, user: userData } = response;

      // Store tokens
      setTokens(accessToken || token, refreshToken);

      // Store user
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionError(null);

      console.log('✅ Registration successful:', userData.email);
      return { user: userData, message: response.message };
    } catch (error) {
      console.error('❌ Registration failed:', error);

      if (error instanceof ApiError) {
        error.userMessage = getErrorMessage(error);
      }

      throw error;
    }
  };

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  const forgotPassword = async (email) => {
    try {
      const response = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        error.userMessage = getErrorMessage(error);
      }
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        error.userMessage = getErrorMessage(error);
      }
      throw error;
    }
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword: newPassword },
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        error.userMessage = getErrorMessage(error);
      }
      throw error;
    }
  };

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  const getActiveSessions = async () => {
    try {
      const response = await api('/api/auth/sessions', { method: 'GET' });
      return response.sessions || [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await api(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    }
  };

  const revokeAllSessions = async (exceptCurrent = true) => {
    try {
      await api('/api/auth/sessions/revoke-all', {
        method: 'POST',
        body: { exceptCurrent },
      });
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      throw error;
    }
  };

  // ==========================================
  // CLEAR SESSION ERROR
  // ==========================================

  const clearSessionError = () => {
    setSessionError(null);
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    // State
    user,
    loading,
    sessionError,
    isAuthenticated: !!user,

    // Auth methods
    login,
    loginWithOAuth,
    logout,
    register,
    refreshUser,
    updateUser,

    // Password methods
    forgotPassword,
    resetPassword,
    changePassword,

    // Session methods
    getActiveSessions,
    revokeSession,
    revokeAllSessions,

    // Utility
    clearSessionError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// EXPORT ERROR UTILITIES
// ==========================================

export { ApiError, AuthError, RateLimitError, getErrorMessage };