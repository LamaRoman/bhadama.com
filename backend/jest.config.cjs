// ==========================================
// JEST CONFIGURATION - BACKEND
// ==========================================
// File: backend/jest.config.js
// ==========================================

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Setup file (runs before each test file)
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/server.js',
    '!src/config/**',
    '!src/prisma/**'
  ],

  // Coverage thresholds (enforced)
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },

  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Timeout for async tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Module paths (if using aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};