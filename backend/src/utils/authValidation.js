export const validateRegistration = (data) => {
  const errors = [];
  const { name, email, password, role } = data;

  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!password || password.trim() === '') {
    errors.push('Password is required for email registration');
  }

  if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }

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

  if (!email || !password) {
    errors.push('Email and password are required');
  }

  if (email && !email.includes('@')) {
    errors.push('Valid email is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRoleChange = (data) => {
  const errors = [];
  const { newRole } = data;

  const validRoles = ['USER', 'HOST'];
  if (!newRole || !validRoles.includes(newRole)) {
    errors.push('Invalid role. Must be USER or HOST');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};