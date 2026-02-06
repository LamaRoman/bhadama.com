// contexts/AuthContext.js
// ==========================================
// SECURE AUTH CONTEXT - FIXED VERSION
// ==========================================
// 
// FIXES APPLIED:
// 1. ✅ Removed console.log that exposed sensitive data
// 2. ✅ All logging wrapped in devLog
// 3. ✅ Cleaner code structure
//
// Features:
// 1. Dual token storage (access + refresh)
// 2. Automatic token refresh
// 3. Session management
// 4. Handles locked/suspended accounts
// 5. Clean, minimal logging (dev only)
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

// ==========================================
// UTILITY: Conditional logging (dev only)
// ==========================================
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

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
    const token = getAccessToken();
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        devLog('✅ User session restored');
      } catch (error) {
        devError('Failed to parse stored user:', error);
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

      devLog('✅ Login successful');
      return userData;
    } catch (error) {
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
      // Store tokens
      setTokens(accessToken, refreshToken);

      // Store user
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionError(null);

      devLog('✅ OAuth login successful');
      return userData;
    } catch (error) {
      devError('OAuth login failed:', error);
      throw error;
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(async (callApi = true) => {
    // Call logout API if requested (to invalidate server session)
    if (callApi) {
      try {
        await api('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignore logout API errors
        devError('Logout API call failed:', error.message);
      }
    }

    // Clear local storage
    clearTokens();
    setUser(null);

    devLog('✅ Logged out');
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

      devLog('✅ User data refreshed');
      return updatedUser;
    } catch (error) {
      devError('Failed to refresh user:', error);

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
  // REGISTER - FIXED VERSION
  // ==========================================

  const register = async (formData) => {
    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...registerData } = formData;
      
      // ✅ FIX: Removed console.log that exposed sensitive data
      devLog('📤 Registering user...'); // Don't log actual data

      const response = await api('/api/auth/register', {
        method: 'POST',
        body: registerData,
      });

      const { accessToken, refreshToken, token, user: userData } = response;

      // Store tokens
      setTokens(accessToken || token, refreshToken);

      // Store user
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionError(null);

      devLog('✅ Registration successful');
      return { user: userData, message: response.message };
      
    } catch (error) {
      // Only log minimal info in development
      devError('Registration failed:', error.message);

      // Add user-friendly message based on error details
      if (error instanceof ApiError) {
        // If we have specific field errors, create a helpful message
        if (error.details && Array.isArray(error.details) && error.details.length > 0) {
          const fieldMessages = error.details.map(d => d.message).join('. ');
          error.userMessage = fieldMessages;
        } else {
          error.userMessage = getErrorMessage(error);
        }
      }

      // Throw the error with all details intact
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
      devError('Failed to get sessions:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await api(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
    } catch (error) {
      devError('Failed to revoke session:', error);
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
      devError('Failed to revoke all sessions:', error);
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