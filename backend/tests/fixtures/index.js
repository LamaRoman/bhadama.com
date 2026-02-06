// ==========================================
// TEST FIXTURES - REUSABLE TEST DATA
// ==========================================
// File: backend/tests/fixtures/index.js
// ==========================================

// ==========================================
// USER FIXTURES
// ==========================================
export const validUserData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Test@123456',
  confirmPassword: 'Test@123456',
  role: 'USER'
};

export const validHostData = {
  name: 'Jane Host',
  email: 'jane@example.com',
  password: 'Test@123456',
  confirmPassword: 'Test@123456',
  role: 'HOST'
};

export const invalidUserData = {
  missingEmail: {
    name: 'Test User',
    password: 'Test@123456'
  },
  invalidEmail: {
    name: 'Test User',
    email: 'not-an-email',
    password: 'Test@123456'
  },
  weakPassword: {
    name: 'Test User',
    email: 'test@example.com',
    password: '123'  // Too short, no special chars
  },
  passwordMismatch: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123456',
    confirmPassword: 'Different@123'
  }
};

// ==========================================
// LOGIN FIXTURES
// ==========================================
export const validLoginData = {
  email: 'john@example.com',
  password: 'Test@123456'
};

export const invalidLoginData = {
  wrongPassword: {
    email: 'john@example.com',
    password: 'WrongPassword@123'
  },
  nonExistentUser: {
    email: 'nobody@example.com',
    password: 'Test@123456'
  },
  missingPassword: {
    email: 'john@example.com'
  }
};

// ==========================================
// LISTING FIXTURES
// ==========================================
export const validListingData = {
  title: 'Beautiful Garden Venue',
  description: 'A stunning outdoor venue perfect for weddings and events',
  location: 'Kathmandu',
  address: '123 Garden Street, Kathmandu',
  capacity: 100,
  minCapacity: 20,
  hourlyRate: 10000,
  minHours: 3,
  maxHours: 12,
  includedGuests: 20,
  extraGuestCharge: 500,
  amenities: ['WiFi', 'Parking', 'AC', 'Catering', 'Sound System'],
  rules: ['No smoking', 'No outside food', 'Music until 10 PM'],
  operatingHours: {
    monday: { open: '08:00', close: '22:00' },
    tuesday: { open: '08:00', close: '22:00' },
    wednesday: { open: '08:00', close: '22:00' },
    thursday: { open: '08:00', close: '22:00' },
    friday: { open: '08:00', close: '23:00' },
    saturday: { open: '08:00', close: '23:00' },
    sunday: { open: '08:00', close: '22:00' }
  }
};

export const invalidListingData = {
  missingTitle: {
    description: 'A venue',
    location: 'Kathmandu',
    capacity: 50,
    hourlyRate: 5000
  },
  invalidCapacity: {
    title: 'Test Venue',
    location: 'Kathmandu',
    capacity: -10,  // Invalid
    hourlyRate: 5000
  },
  invalidRate: {
    title: 'Test Venue',
    location: 'Kathmandu',
    capacity: 50,
    hourlyRate: 0  // Invalid
  }
};

// ==========================================
// BOOKING FIXTURES
// ==========================================
export const validBookingData = {
  bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  startTime: '10:00',
  endTime: '14:00',
  guests: 30,
  specialRequests: 'Please arrange extra chairs'
};

export const invalidBookingData = {
  pastDate: {
    bookingDate: '2020-01-01',
    startTime: '10:00',
    endTime: '14:00',
    guests: 30
  },
  invalidTimeRange: {
    bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '10:00',  // End before start
    guests: 30
  },
  exceedsCapacity: {
    bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '14:00',
    guests: 9999  // Way over capacity
  },
  zeroGuests: {
    bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '14:00',
    guests: 0
  }
};

// ==========================================
// PAYMENT FIXTURES
// ==========================================
export const validPaymentData = {
  esewa: {
    gateway: 'ESEWA',
    amount: 25000,
    currency: 'NPR'
  },
  khalti: {
    gateway: 'KHALTI',
    amount: 25000,
    currency: 'NPR'
  }
};

export const mockEsewaCallback = {
  success: {
    oid: 'booking-123',
    amt: '25000',
    refId: 'esewa-ref-123456'
  },
  failure: {
    oid: 'booking-123',
    amt: '25000',
    refId: ''
  }
};

export const mockKhaltiCallback = {
  success: {
    pidx: 'khalti-pidx-123456',
    status: 'Completed',
    transaction_id: 'khalti-txn-123',
    amount: 2500000  // In paisa
  },
  failure: {
    pidx: 'khalti-pidx-123456',
    status: 'Failed',
    transaction_id: '',
    amount: 2500000
  }
};

// ==========================================
// REVIEW FIXTURES
// ==========================================
export const validReviewData = {
  rating: 5,
  title: 'Amazing Venue!',
  comment: 'We had our wedding here and it was absolutely perfect. The host was very accommodating.',
  cleanliness: 5,
  accuracy: 5,
  communication: 5,
  location: 4,
  checkin: 5,
  value: 4
};

export const invalidReviewData = {
  invalidRating: {
    rating: 6,  // Max is 5
    comment: 'Great place'
  },
  missingComment: {
    rating: 5
  },
  tooShortComment: {
    rating: 5,
    comment: 'Ok'  // Too short
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a future date string
 * @param {number} daysFromNow - Days from today
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const getFutureDate = (daysFromNow = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Generate random email
 * @returns {string} Random email address
 */
export const getRandomEmail = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Calculate expected booking total
 * @param {number} hourlyRate 
 * @param {number} hours 
 * @param {number} guests 
 * @param {number} includedGuests 
 * @param {number} extraGuestCharge 
 * @returns {object} Price breakdown
 */
export const calculateExpectedTotal = (
  hourlyRate,
  hours,
  guests,
  includedGuests = 10,
  extraGuestCharge = 0
) => {
  const basePrice = hourlyRate * hours;
  const extraGuests = Math.max(0, guests - includedGuests);
  const extraGuestPrice = extraGuests * extraGuestCharge * hours;
  const subtotal = basePrice + extraGuestPrice;
  const serviceFee = Math.round(subtotal * 0.05);  // 5%
  const tax = Math.round(subtotal * 0.05);  // 5%
  const totalPrice = subtotal + serviceFee + tax;

  return {
    basePrice,
    extraGuestPrice,
    serviceFee,
    tax,
    totalPrice
  };
};