/**
 * Validation functions for user-related routes
 * FIXED: Added null/undefined checks before calling .trim()
 */

export const validateProfileUpdate = (data) => {
  const errors = [];
  const { name, phone } = data;

  // Name validation (optional but if provided must be valid)
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push('Name cannot be empty');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Name must not exceed 100 characters');
    }
  }

  // Phone validation (optional but if provided must be valid)
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (phone.trim() !== '' && !isValidPhone(phone)) {
      errors.push('Please provide a valid phone number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRoleChange = (data) => {
  const errors = [];
  const { newRole } = data;

  // Role validation
  const validRoles = ['USER', 'HOST'];
  if (!newRole || typeof newRole !== 'string') {
    errors.push('New role is required');
  } else if (!validRoles.includes(newRole)) {
    errors.push('Invalid role. Must be USER or HOST');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAdminRoleChange = (data) => {
  const errors = [];
  const { adminRole } = data;

  // Admin role validation
  const validAdminRoles = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT'];
  if (!adminRole || typeof adminRole !== 'string') {
    errors.push('Admin role is required');
  } else if (!validAdminRoles.includes(adminRole)) {
    errors.push('Invalid admin role. Must be SUPER_ADMIN, CONTENT_MANAGER, or SUPPORT');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserSuspension = (data) => {
  const errors = [];
  const { suspended, suspendedReason } = data;

  // Suspended validation
  if (typeof suspended !== 'boolean') {
    errors.push('Suspended status must be a boolean');
  }

  // Suspended reason validation
  if (suspended === true) {
    if (!suspendedReason || typeof suspendedReason !== 'string' || suspendedReason.trim() === '') {
      errors.push('Suspension reason is required when suspending a user');
    } else if (suspendedReason.trim().length < 10) {
      errors.push('Suspension reason must be at least 10 characters long');
    } else if (suspendedReason.trim().length > 500) {
      errors.push('Suspension reason must not exceed 500 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePagination = (data) => {
  const errors = [];
  const { page, limit } = data;

  // Page validation
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  // Limit validation
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserSearch = (data) => {
  const errors = [];
  const { search, role } = data;

  // Search validation (optional)
  if (search !== undefined && search !== null) {
    if (typeof search !== 'string') {
      errors.push('Search term must be a string');
    } else if (search.trim() !== '') {
      if (search.length < 2) {
        errors.push('Search term must be at least 2 characters long');
      } else if (search.length > 100) {
        errors.push('Search term must not exceed 100 characters');
      }
    }
  }

  // Role validation (optional)
  if (role !== undefined && role !== null) {
    if (typeof role !== 'string') {
      errors.push('Role must be a string');
    } else if (role.trim() !== '') {
      const validRoles = ['USER', 'HOST', 'ADMIN', 'MODERATOR'];
      if (!validRoles.includes(role)) {
        errors.push('Invalid role filter');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserId = (userId) => {
  const errors = [];

  if (!userId) {
    errors.push('User ID is required');
  } else {
    const id = parseInt(userId);
    if (isNaN(id) || id < 1) {
      errors.push('Invalid user ID');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate phone number format
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}