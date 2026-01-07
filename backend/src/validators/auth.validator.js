/**
 * Validation functions for authentication routes
 * FIXED: Added null/undefined checks before calling .trim()
 */

export const validateRegistration = (data) => {
  const errors = [];
  const { name, email, password, role } = data;

  // Name validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Email validation
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  // Password validation (only for email/password registration)
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required for email registration');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  // Role validation
  if (role && !['USER', 'HOST'].includes(role)) {
    errors.push('Invalid role. Must be USER or HOST');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLogin = (data) => {
  const errors = [];
  const { email, password } = data;

  // Email validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  // Password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePasswordReset = (data) => {
  const errors = [];
  const { email } = data;

  // Email validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateNewPassword = (data) => {
  const errors = [];
  const { password, confirmPassword } = data;

  // Password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  // Confirm password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!confirmPassword || typeof confirmPassword !== 'string' || confirmPassword.trim() === '') {
    errors.push('Please confirm your password');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateChangePassword = (data) => {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = data;

  // Current password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
    errors.push('Current password is required');
  }

  // New password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
    errors.push('New password is required');
  } else {
    if (newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }
    if (newPassword.length > 128) {
      errors.push('New password must not exceed 128 characters');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('New password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('New password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('New password must contain at least one number');
    }
    if (currentPassword && currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }
  }

  // Confirm password validation - CHECK FOR NULL/UNDEFINED FIRST
  if (!confirmPassword || typeof confirmPassword !== 'string' || confirmPassword.trim() === '') {
    errors.push('Please confirm your new password');
  } else if (newPassword !== confirmPassword) {
    errors.push('New passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate email format
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}