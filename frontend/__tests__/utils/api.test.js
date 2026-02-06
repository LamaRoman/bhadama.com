// __tests__/utils/api.test.js
import {
  api,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  ApiError,
  AuthError,
  RateLimitError,
  TimeoutError,
  getErrorMessage,
  formatRateLimitMessage,
  shouldLogout,
  isRetriableError,
} from '@/utils/api';

describe('Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('should return null when no token exists', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('should return token when it exists', () => {
      localStorage.setItem('accessToken', 'test-access-token');
      expect(getAccessToken()).toBe('test-access-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no token exists', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('should return token when it exists', () => {
      localStorage.setItem('refreshToken', 'test-refresh-token');
      expect(getRefreshToken()).toBe('test-refresh-token');
    });
  });

  describe('setTokens', () => {
    it('should set access token', () => {
      setTokens('new-access-token', null);
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(localStorage.getItem('token')).toBe('new-access-token');
    });

    it('should set refresh token', () => {
      setTokens(null, 'new-refresh-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });

    it('should set both tokens', () => {
      setTokens('access', 'refresh');
      expect(localStorage.getItem('accessToken')).toBe('access');
      expect(localStorage.getItem('refreshToken')).toBe('refresh');
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', () => {
      localStorage.setItem('accessToken', 'test');
      localStorage.setItem('refreshToken', 'test');
      localStorage.setItem('token', 'test');
      localStorage.setItem('user', '{}');

      clearTokens();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400, null, 'req-123', { field: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.requestId).toBe('req-123');
      expect(error.details).toEqual({ field: 'value' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry info', () => {
      const error = new RateLimitError('Too many requests', 60, 'req-123');
      
      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.status).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('AuthError', () => {
    it('should create auth error', () => {
      const error = new AuthError('Not authorized', 'INVALID_TOKEN', 'req-123');
      
      expect(error.message).toBe('Not authorized');
      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.status).toBe(401);
      expect(error.name).toBe('AuthError');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timed out', 'req-123');
      
      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.status).toBe(0);
      expect(error.name).toBe('TimeoutError');
    });
  });
});

describe('api() function', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('successful requests', () => {
    it('should make GET request successfully', async () => {
      const mockData = { message: 'Success', data: [1, 2, 3] };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
        headers: new Headers(),
      });

      const result = await api('/api/test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request with body', async () => {
      const mockData = { success: true };
      const requestBody = { email: 'test@example.com', password: 'password' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
        headers: new Headers(),
      });

      const result = await api('/api/auth/login', {
        method: 'POST',
        body: requestBody,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
        headers: new Headers(),
      });

      const result = await api('/api/test', { method: 'DELETE' });

      expect(result).toEqual({});
    });

    it('should include authorization header when token exists', async () => {
      localStorage.setItem('accessToken', 'my-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        headers: new Headers(),
      });

      await api('/api/protected');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should handle FormData without Content-Type header', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"success": true}'),
        headers: new Headers(),
      });

      await api('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBeUndefined();
      expect(callArgs.body).toBe(formData);
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for 400 Bad Request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
        })),
        headers: new Headers(),
      });

      await expect(api('/api/test')).rejects.toThrow(ApiError);
    });

    it('should throw RateLimitError for 429', async () => {
      const headers = new Headers();
      headers.set('Retry-After', '60');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60,
        })),
        headers,
      });

      await expect(api('/api/test')).rejects.toThrow(RateLimitError);
    });

    it('should throw AuthError for 401', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized', code: 'AUTH_FAILED' }),
        text: () => Promise.resolve(JSON.stringify({
          error: 'Unauthorized',
          code: 'AUTH_FAILED',
        })),
        headers: new Headers(),
      });

      await expect(api('/api/test')).rejects.toThrow(AuthError);
    });

    it('should throw ApiError for network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api('/api/test')).rejects.toThrow(ApiError);
    });
  });
});

describe('Helper Functions', () => {
  describe('formatRateLimitMessage', () => {
    it('should format message with minutes', () => {
      const error = new RateLimitError('Test', 120, 'req-123');
      expect(formatRateLimitMessage(error)).toBe('Too many attempts. Please try again in 2 minutes.');
    });

    it('should format message with seconds', () => {
      const error = new RateLimitError('Test', 30, 'req-123');
      expect(formatRateLimitMessage(error)).toBe('Too many attempts. Please try again in 30 seconds.');
    });
  });

  describe('getErrorMessage', () => {
    it('should return timeout message', () => {
      const error = new TimeoutError('Test', 'req-123');
      expect(getErrorMessage(error)).toBe('The request took too long. Please try again.');
    });

    it('should return mapped error message for known codes', () => {
      const error = new ApiError('Test', 'ACCOUNT_LOCKED', 403);
      expect(getErrorMessage(error)).toBe('Your account is temporarily locked. Please try again later.');
    });
  });

  describe('shouldLogout', () => {
    it('should return true for session expired', () => {
      const error = new ApiError('Session expired', 'SESSION_EXPIRED', 401);
      expect(shouldLogout(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new ApiError('Bad request', 'VALIDATION_ERROR', 400);
      expect(shouldLogout(error)).toBe(false);
    });
  });

  describe('isRetriableError', () => {
    it('should return false for auth errors', () => {
      const error = new ApiError('Auth failed', 'AUTH_FAILED', 401);
      expect(isRetriableError(error)).toBe(false);
    });

    it('should return true for network errors', () => {
      const error = new ApiError('Network error', 'NETWORK_ERROR', 0);
      expect(isRetriableError(error)).toBe(true);
    });
  });
});
