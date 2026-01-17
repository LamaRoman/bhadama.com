// backend/config/verificationConfig.js

/**
 * Verification Rules Configuration
 * Define what verification is required for each user role
 */

export const VERIFICATION_RULES = {
  USER: {
    // Email verification
    emailRequired: true,              // Must verify email to book
    emailRequiredFor: ['booking'],    // Actions that require email verification
    
    // Phone verification
    phoneRequired: false,             // Phone verification NOT required for users
    phoneCollection: true,            // But we collect phone number
    phoneOptional: true,              // Show option to verify (for incentives)
    phoneRequiredFor: [],             // No actions require phone verification
    
    // Display messages
    emailVerificationMessage: 'Please verify your email to start booking spaces',
    phoneVerificationMessage: 'Verify your phone number for faster booking confirmations',
  },
  
  HOST: {
    // Email verification
    emailRequired: true,              // Must verify email to list
    emailRequiredFor: ['listing'],    // Actions that require email verification
    
    // Phone verification
    phoneRequired: true,              // Phone verification MANDATORY for hosts
    phoneCollection: true,            // Collect phone number
    phoneOptional: false,             // Not optional, it's required
    phoneRequiredFor: ['listing', 'publishing'], // Actions that require phone verification
    
    // Display messages
    emailVerificationMessage: 'Please verify your email to create listings',
    phoneVerificationMessage: 'Phone verification is required before you can publish listings',
  }
};

/**
 * Get verification requirements for a user role
 */
export function getVerificationRequirements(role) {
  return VERIFICATION_RULES[role] || VERIFICATION_RULES.USER;
}

/**
 * Check if email verification is required for a role
 */
export function isEmailVerificationRequired(role) {
  const rules = getVerificationRequirements(role);
  return rules.emailRequired;
}

/**
 * Check if phone verification is required for a role
 */
export function isPhoneVerificationRequired(role) {
  const rules = getVerificationRequirements(role);
  return rules.phoneRequired;
}

/**
 * Check if action requires email verification
 */
export function requiresEmailVerification(role, action) {
  const rules = getVerificationRequirements(role);
  return rules.emailRequired && rules.emailRequiredFor.includes(action);
}

/**
 * Check if action requires phone verification
 */
export function requiresPhoneVerification(role, action) {
  const rules = getVerificationRequirements(role);
  return rules.phoneRequired && rules.phoneRequiredFor.includes(action);
}

/**
 * Get verification status message
 */
export function getVerificationMessage(role, verificationType) {
  const rules = getVerificationRequirements(role);
  
  if (verificationType === 'email') {
    return rules.emailVerificationMessage;
  } else if (verificationType === 'phone') {
    return rules.phoneVerificationMessage;
  }
  
  return 'Please complete verification';
}

/**
 * Check if user meets all verification requirements for their role
 */
export function meetsVerificationRequirements(user) {
  const rules = getVerificationRequirements(user.role);
  
  const checks = {
    emailVerified: rules.emailRequired ? user.emailVerified : true,
    phoneVerified: rules.phoneRequired ? user.phoneVerified : true,
  };
  
  return {
    allVerified: checks.emailVerified && checks.phoneVerified,
    ...checks
  };
}