/**
 * Email Validation Service
 * Validates email addresses before sending invitations
 */

// Common disposable email domains (subset - extend as needed)
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com'
]);

// Common typos in popular email domains
const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
};

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  warnings?: string[];
}

/**
 * Validate email address format
 */
function isValidFormat(email: string): boolean {
  // RFC 5322 simplified regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Check if email is from a disposable domain
 */
function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Check for common typos and suggest corrections
 */
function checkForTypos(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && COMMON_TYPOS[domain]) {
    const localPart = email.split('@')[0];
    return `${localPart}@${COMMON_TYPOS[domain]}`;
  }
  return null;
}

/**
 * Validate business email (not free consumer emails for enterprise use)
 */
function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const freeEmailDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'live.com',
    'msn.com',
    'protonmail.com'
  ]);

  return !freeEmailDomains.has(domain);
}

/**
 * Main email validation function
 * @param email - Email address to validate
 * @param requireBusinessEmail - Whether to require business (non-free) email
 * @returns Validation result with error, suggestions, and warnings
 */
export function validateEmail(
  email: string,
  requireBusinessEmail: boolean = false
): EmailValidationResult {
  const warnings: string[] = [];

  // Basic checks
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check format
  if (!isValidFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  // Check for disposable emails
  if (isDisposable(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Disposable email addresses are not allowed'
    };
  }

  // Check for typos
  const suggestion = checkForTypos(trimmedEmail);
  if (suggestion) {
    warnings.push(`Did you mean ${suggestion}?`);
  }

  // Check if business email is required
  if (requireBusinessEmail && !isBusinessEmail(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please use a business email address',
      warnings
    };
  }

  // Check for suspicious patterns
  const localPart = trimmedEmail.split('@')[0];

  // Too many dots or special characters
  if ((localPart.match(/\./g) || []).length > 3) {
    warnings.push('Email has an unusual number of dots');
  }

  // All numbers (suspicious)
  if (/^\d+$/.test(localPart)) {
    warnings.push('Email local part is all numbers (unusual)');
  }

  // Very long local part (suspicious)
  if (localPart.length > 30) {
    warnings.push('Email local part is unusually long');
  }

  return {
    isValid: true,
    suggestion: suggestion || undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(
  emails: string[],
  requireBusinessEmail: boolean = false
): Map<string, EmailValidationResult> {
  const results = new Map<string, EmailValidationResult>();

  for (const email of emails) {
    const result = validateEmail(email, requireBusinessEmail);
    results.set(email, result);
  }

  return results;
}

/**
 * Extract and validate emails from a comma-separated or newline-separated string
 */
export function extractAndValidateEmails(
  input: string,
  requireBusinessEmail: boolean = false
): {
  valid: string[];
  invalid: Array<{ email: string; error: string }>;
  suggestions: Array<{ original: string; suggested: string }>;
} {
  // Split by comma or newline
  const emails = input
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);

  const valid: string[] = [];
  const invalid: Array<{ email: string; error: string }> = [];
  const suggestions: Array<{ original: string; suggested: string }> = [];

  for (const email of emails) {
    const result = validateEmail(email, requireBusinessEmail);

    if (result.isValid) {
      valid.push(email);
    } else {
      invalid.push({ email, error: result.error || 'Invalid email' });
    }

    if (result.suggestion) {
      suggestions.push({ original: email, suggested: result.suggestion });
    }
  }

  return { valid, invalid, suggestions };
}

/**
 * Check if email domain has MX records (requires DNS lookup - server-side only)
 * This is a placeholder - implement with a DNS library like 'dns' in Node.js
 */
export async function hasValidMXRecords(email: string): Promise<boolean> {
  // In a real implementation, you would use the 'dns' module:
  // const dns = require('dns').promises;
  // const domain = email.split('@')[1];
  // try {
  //   const addresses = await dns.resolveMx(domain);
  //   return addresses.length > 0;
  // } catch {
  //   return false;
  // }

  // For now, just return true (assume valid)
  return true;
}
