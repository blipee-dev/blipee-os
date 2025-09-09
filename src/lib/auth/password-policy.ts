/**
 * Password complexity validation and policy enforcement
 */

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialCharsSet: string;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  minStrengthScore: number; // 0-4 scale
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialCharsSet: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventUserInfo: true,
  minStrengthScore: 3, // Medium strength
};

// Common passwords to prevent (top 100)
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', '111111', 'password123',
  'letmein', 'welcome', 'admin', 'password1', 'welcome123', 'root', 'toor',
  '1234567', '12345', '1234567890', '123123', '000000', 'password!',
];

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strengthScore: number;
  strengthLabel: string;
  suggestions: string[];
}

/**
 * Calculate password strength score (0-4)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character diversity
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
  
  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(password)) score -= 0.5;
  if (/^[0-9]+$/.test(password)) score -= 0.5;
  if (/(.)\1{2,}/.test(password)) score -= 0.5; // Repeated characters
  
  return Math.max(0, Math.min(4, Math.round(score)));
}

/**
 * Get strength label for score
 */
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Very Weak';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return 'Unknown';
  }
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
    suggestions.push(`Add ${policy.minLength - password.length} more characters`);
  }
  
  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }
  
  // Character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  }
  
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  }
  
  if (policy.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${policy.specialCharsSet.replace(/[\[\]\\-]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
      suggestions.push(`Add a special character (${policy.specialCharsSet.slice(0, 10)}...)`);
    }
  }
  
  // Common password check
  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
      errors.push('Password is too common or contains common words');
      suggestions.push('Use a more unique combination of words and characters');
    }
  }
  
  // User info check
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0].split(/[._-]/);
      if (emailParts.some(part => part.length > 2 && lowerPassword.includes(part))) {
        errors.push('Password should not contain parts of your email');
        suggestions.push('Avoid using personal information in your password');
      }
    }
    
    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/);
      if (nameParts.some(part => part.length > 2 && lowerPassword.includes(part))) {
        errors.push('Password should not contain your name');
        suggestions.push('Choose a password unrelated to your personal information');
      }
    }
  }
  
  // Calculate strength
  const strengthScore = calculatePasswordStrength(password);
  const strengthLabel = getStrengthLabel(strengthScore);
  
  // Check minimum strength
  if (strengthScore < policy.minStrengthScore) {
    errors.push(`Password strength must be at least "${getStrengthLabel(policy.minStrengthScore)}"`);
    if (strengthScore < 2) {
      suggestions.push('Mix uppercase, lowercase, numbers, and special characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strengthScore,
    strengthLabel,
    suggestions,
  };
}

/**
 * Generate a strong random password
 */
export function generatePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * React hook for password validation
 */
export function usePasswordValidation(policy?: PasswordPolicy) {
  const validate = (password: string, userInfo?: { email?: string; name?: string }) => {
    return validatePassword(password, policy, userInfo);
  };
  
  return {
    validate,
    generatePassword,
    policy: policy || DEFAULT_PASSWORD_POLICY,
  };
}