// jest.setup.js
import '@testing-library/jest-dom';

// ==========================================
// GLOBAL MOCKS
// ==========================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

// Mock window.addEventListener
const eventListeners = {};
window.addEventListener = jest.fn((event, callback) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);
});

window.removeEventListener = jest.fn((event, callback) => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback);
  }
});

// Helper to trigger events in tests
window.__triggerEvent = (event, detail) => {
  if (eventListeners[event]) {
    eventListeners[event].forEach((callback) => callback({ detail }));
  }
};

// Mock fetch globally
global.fetch = jest.fn();

// ==========================================
// CLEANUP
// ==========================================

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Clear storage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch
  global.fetch.mockReset();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// ==========================================
// CUSTOM MATCHERS (optional)
// ==========================================

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ==========================================
// GLOBAL TEST UTILITIES
// ==========================================

// Helper to wait for async operations
global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to flush promises
global.flushPromises = () => new Promise(setImmediate);
