// __tests__/test-utils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

// ==========================================
// MOCK AUTH CONTEXT FOR TESTING
// ==========================================

const defaultAuthValue = {
  user: null,
  loading: false,
  isAuthenticated: false,
  sessionError: null,
  login: jest.fn(),
  loginWithOAuth: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refreshUser: jest.fn(),
  updateUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  getActiveSessions: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
  clearSessionError: jest.fn(),
};

// Create a mock AuthContext for controlled testing
const MockAuthContext = React.createContext(defaultAuthValue);

export const MockAuthProvider = ({ children, value = {} }) => {
  const contextValue = { ...defaultAuthValue, ...value };
  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// ==========================================
// CUSTOM RENDER FUNCTION
// ==========================================

export function renderWithProviders(
  ui,
  {
    authValue = {},
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MockAuthProvider value={authValue}>
        {children}
      </MockAuthProvider>
    );
  }
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authValue: { ...defaultAuthValue, ...authValue },
  };
}

// ==========================================
// MOCK DATA FACTORIES
// ==========================================

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  emailVerified: true,
  phoneVerified: false,
  phone: '+9779812345678',
  avatar: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockHost = (overrides = {}) => ({
  ...createMockUser(),
  id: 'host-123',
  email: 'host@example.com',
  role: 'HOST',
  emailVerified: true,
  phoneVerified: true,
  ...overrides,
});

export const createMockAdmin = (overrides = {}) => ({
  ...createMockUser(),
  id: 'admin-123',
  email: 'admin@mybigyard.com',
  role: 'ADMIN',
  emailVerified: true,
  phoneVerified: true,
  ...overrides,
});

export const createMockListing = (overrides = {}) => ({
  id: 'listing-123',
  slug: 'beautiful-venue-kathmandu',
  title: 'Beautiful Venue in Kathmandu',
  description: 'A wonderful venue for events',
  category: 'EVENT_HALL',
  location: {
    address: 'Thamel, Kathmandu',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    country: 'Nepal',
  },
  capacity: 100,
  pricePerHour: 5000,
  pricePerDay: 40000,
  amenities: ['PARKING', 'WIFI', 'AC'],
  images: [
    { id: 'img-1', url: 'https://example.com/image1.jpg', isCover: true },
  ],
  status: 'ACTIVE',
  hostId: 'host-123',
  averageRating: 4.5,
  reviewCount: 10,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 'booking-123',
  listingId: 'listing-123',
  userId: 'user-123',
  startDate: '2024-02-01T10:00:00.000Z',
  endDate: '2024-02-01T18:00:00.000Z',
  totalAmount: 40000,
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  paymentMethod: 'ESEWA',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

export const createMockReview = (overrides = {}) => ({
  id: 'review-123',
  listingId: 'listing-123',
  userId: 'user-123',
  bookingId: 'booking-123',
  rating: 5,
  comment: 'Great venue! Highly recommended.',
  createdAt: '2024-01-20T00:00:00.000Z',
  updatedAt: '2024-01-20T00:00:00.000Z',
  user: {
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
  },
  ...overrides,
});

// ==========================================
// API MOCK HELPERS
// ==========================================

export const mockApiSuccess = (data, status = 200) => {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  });
};

export const mockApiError = (error, status = 400, code = 'ERROR') => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error, code }),
    text: () => Promise.resolve(JSON.stringify({ error, code })),
    headers: new Headers(),
  });
};

export const mockApiRateLimit = (retryAfter = 60) => {
  const headers = new Headers();
  headers.set('Retry-After', retryAfter.toString());
  
  return Promise.resolve({
    ok: false,
    status: 429,
    json: () => Promise.resolve({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    }),
    text: () => Promise.resolve(JSON.stringify({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    })),
    headers,
  });
};

export const mockApiAuthError = (code = 'INVALID_TOKEN') => {
  return Promise.resolve({
    ok: false,
    status: 401,
    json: () => Promise.resolve({
      error: 'Authentication failed',
      code,
    }),
    text: () => Promise.resolve(JSON.stringify({
      error: 'Authentication failed',
      code,
    })),
    headers: new Headers(),
  });
};

// ==========================================
// WAIT UTILITIES
// ==========================================

export const waitForCondition = async (condition, timeout = 5000, interval = 50) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  
  throw new Error('Condition not met within timeout');
};

// ==========================================
// RE-EXPORT TESTING LIBRARY
// ==========================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
