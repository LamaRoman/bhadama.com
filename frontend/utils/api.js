// utils/api.js
// ==========================================
// SECURE API CLIENT - FIXED VERSION
// ==========================================
// Features:
// 1. Automatic token refresh on expiry
// 2. Rate limit handling with retry info
// 3. Specific error code handling
// 4. Request ID tracking for debugging
// 5. Clean, minimal logging (dev only)
// 
// FIXES APPLIED:
// 1. ✅ Added request timeout to prevent hanging requests
// 2. ✅ Better error messages for common scenarios
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// ✅ NEW: Default request timeout (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Token refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Generate unique request ID for tracking
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ==========================================
// UTILITY: Conditional logging (dev only)
// ==========================================
const devLog = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

const devError = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, ...args);
  }
};

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

export const setTokens = (accessToken, refreshToken) => {
  if (typeof window === "undefined") return;
  
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    // Also store as 'token' for backward compatibility
    localStorage.setItem("token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ==========================================
// TOKEN REFRESH
// ==========================================

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Token refresh failed");
    }

    const data = await response.json();
    
    // Store new access token
    setTokens(data.accessToken, null);
    
    return data.accessToken;
  } catch (error) {
    // Refresh failed - clear everything and force re-login
    clearTokens();
    throw error;
  }
};

// ==========================================
// ERROR CLASSES
// ==========================================

export class ApiError extends Error {
  constructor(message, code, status, retryAfter = null, requestId = null, details = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.requestId = requestId;
    this.details = details;
  }
}

export class RateLimitError extends ApiError {
  constructor(message, retryAfter, requestId, details = null) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, retryAfter, requestId, details);
    this.name = "RateLimitError";
  }
}

export class AuthError extends ApiError {
  constructor(message, code, requestId, details = null) {
    super(message, code, 401, null, requestId, details);
    this.name = "AuthError";
  }
}

// ✅ NEW: Timeout error class
export class TimeoutError extends ApiError {
  constructor(message, requestId) {
    super(message, "TIMEOUT", 0, null, requestId);
    this.name = "TimeoutError";
  }
}

// ==========================================
// MAIN API FUNCTION
// ==========================================

export async function api(url, options = {}) {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const requestId = generateRequestId();

  // Get token
  const token = getAccessToken();

  // Detect if the body is FormData
  const isFormData = options.body instanceof FormData;

  // Build headers
  const headers = {
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "X-Request-ID": requestId,
  };

  // ✅ NEW: Add timeout support
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    body: isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
    credentials: "include",
    signal: controller.signal, // ✅ NEW: Add abort signal
  };

  // Remove body for GET/HEAD requests
  if (["GET", "HEAD"].includes(fetchOptions.method)) {
    delete fetchOptions.body;
  }

  try {
    let response = await fetch(fullUrl, fetchOptions);
    
    // ✅ Clear timeout on successful response
    clearTimeout(timeoutId);

    // Handle token expiry - attempt refresh
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));

      // Check if token expired (not invalid or other auth errors)
      if (errorData.code === "TOKEN_EXPIRED" || errorData.code === "INVALID_TOKEN") {
        // Try to refresh the token
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            const newToken = await refreshAccessToken();
            isRefreshing = false;
            onTokenRefreshed(newToken);

            // Retry original request with new token
            headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(fullUrl, { ...fetchOptions, headers });
          } catch (refreshError) {
            isRefreshing = false;
            // Dispatch event for AuthContext to handle logout
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:logout", { 
                detail: { reason: "TOKEN_REFRESH_FAILED" } 
              }));
            }
            throw new AuthError("Session expired. Please log in again.", "SESSION_EXPIRED", requestId);
          }
        } else {
          // Wait for the ongoing refresh to complete
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async (newToken) => {
              try {
                headers.Authorization = `Bearer ${newToken}`;
                const retryResponse = await fetch(fullUrl, { ...fetchOptions, headers });
                const data = await handleResponse(retryResponse, requestId);
                resolve(data);
              } catch (error) {
                reject(error);
              }
            });
          });
        }
      } else {
        // Other auth errors (ACCOUNT_LOCKED, ACCOUNT_SUSPENDED, etc.)
        throw new AuthError(
          errorData.error || "Authentication failed",
          errorData.code || "AUTH_FAILED",
          requestId,
          errorData.details
        );
      }
    }

    return await handleResponse(response, requestId);
  } catch (error) {
    // ✅ Clear timeout on error too
    clearTimeout(timeoutId);
    
    // ✅ NEW: Handle timeout/abort errors
    if (error.name === 'AbortError') {
      throw new TimeoutError(
        "Request timed out. Please check your connection and try again.",
        requestId
      );
    }
    
    // Re-throw ApiError subclasses
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    devError("API Error:", error.message);
    throw new ApiError(
      error.message || "Network error. Please check your connection.",
      "NETWORK_ERROR",
      0,
      null,
      requestId
    );
  }
}

// ==========================================
// RESPONSE HANDLER
// ==========================================
async function handleResponse(response, requestId) {
  // Handle no content
  if (response.status === 204) {
    return {};
  }

  // Get response text
  const responseText = await response.text();

  // Parse JSON
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    devError("Failed to parse response:", responseText);
    throw new ApiError(
      "Invalid response from server", 
      "PARSE_ERROR", 
      response.status, 
      null, 
      requestId,
      null
    );
  }

  // Handle errors
  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed (${response.status})`;
    const errorCode = data.code || "UNKNOWN_ERROR";
    const errorDetails = data.details || null;

    // Only log in development
    devLog('API Error:', {
      status: response.status,
      code: errorCode,
      message: errorMessage
    });

    // Rate limit error
    if (response.status === 429) {
      const retryAfter = data.retryAfter || parseInt(response.headers.get("Retry-After")) || 60;
      throw new RateLimitError(errorMessage, retryAfter, requestId, errorDetails);
    }

    // Auth errors
    if (response.status === 401) {
      throw new AuthError(errorMessage, errorCode, requestId, errorDetails);
    }

    // Other errors (including validation errors)
    throw new ApiError(
      errorMessage, 
      errorCode, 
      response.status, 
      null, 
      requestId, 
      errorDetails
    );
  }

  return data;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format rate limit error message with countdown
 */
export const formatRateLimitMessage = (error) => {
  if (!(error instanceof RateLimitError)) {
    return error.message;
  }

  const minutes = Math.ceil(error.retryAfter / 60);
  if (minutes > 1) {
    return `Too many attempts. Please try again in ${minutes} minutes.`;
  }
  return `Too many attempts. Please try again in ${error.retryAfter} seconds.`;
};

/**
 * Get user-friendly error message based on error code
 */
export const getErrorMessage = (error) => {
  if (error instanceof RateLimitError) {
    return formatRateLimitMessage(error);
  }
  
  // ✅ NEW: Handle timeout errors
  if (error instanceof TimeoutError) {
    return "The request took too long. Please try again.";
  }

  const errorMessages = {
    // Auth errors
    ACCOUNT_LOCKED: "Your account is temporarily locked. Please try again later.",
    ACCOUNT_SUSPENDED: "Your account has been suspended. Please contact support.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    EMAIL_NOT_VERIFIED: "Please verify your email to continue.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    
    // Rate limit errors
    LOGIN_RATE_LIMIT: "Too many login attempts. Please try again later.",
    REGISTRATION_RATE_LIMIT: "Too many registration attempts. Please try again later.",
    PASSWORD_RESET_RATE_LIMIT: "Too many password reset attempts. Please try again later.",
    
    // Validation errors
    VALIDATION_ERROR: "Please check your input and try again.",
    
    // Network errors
    NETWORK_ERROR: "Connection error. Please check your internet connection.",
    TIMEOUT: "The request took too long. Please try again.",
    
    // Default
    UNKNOWN_ERROR: "Something went wrong. Please try again.",
  };

  if (error instanceof ApiError && error.code) {
    return errorMessages[error.code] || error.message;
  }

  return error.message || errorMessages.UNKNOWN_ERROR;
};

/**
 * Check if error requires logout
 */
export const shouldLogout = (error) => {
  if (!(error instanceof ApiError)) return false;
  
  const logoutCodes = ["SESSION_EXPIRED", "TOKEN_REFRESH_FAILED", "ACCOUNT_SUSPENDED"];
  return logoutCodes.includes(error.code);
};

/**
 * ✅ NEW: Check if error is retriable
 */
export const isRetriableError = (error) => {
  if (!(error instanceof ApiError)) return true; // Network errors are retriable
  
  // Don't retry auth errors or validation errors
  const nonRetriableCodes = [
    "AUTH_FAILED", 
    "INVALID_CREDENTIALS", 
    "VALIDATION_ERROR",
    "ACCOUNT_LOCKED",
    "ACCOUNT_SUSPENDED"
  ];
  
  return !nonRetriableCodes.includes(error.code);
};

// ==========================================
// BACKWARD COMPATIBILITY
// ==========================================

// For existing code that uses localStorage.getItem('token')
// The setTokens function also sets 'token' for compatibility

export default api;