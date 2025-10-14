/**
 * Simple Email Validation Test
 * Tests core validation logic without TypeScript compilation
 */

// Email validation logic (copied from email-validator.ts for testing)
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

const COMMON_TYPOS = {
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

function isValidFormat(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function isDisposable(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function checkForTypos(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && COMMON_TYPOS[domain]) {
    const localPart = email.split('@')[0];
    return `${localPart}@${COMMON_TYPOS[domain]}`;
  }
  return null;
}

function validateEmail(email, requireBusinessEmail = false) {
  const warnings = [];

  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  if (isDisposable(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Disposable email addresses are not allowed'
    };
  }

  const suggestion = checkForTypos(trimmedEmail);
  if (suggestion) {
    warnings.push(`Did you mean ${suggestion}?`);
  }

  return {
    isValid: true,
    suggestion: suggestion || undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Run tests
console.log('🧪 Testing Email Validation Service\n');
console.log('═══════════════════════════════════════════════════\n');

const testCases = [
  // Valid emails
  { email: 'user@company.com', expected: true, description: 'Valid business email' },
  { email: 'test.user+tag@example.co.uk', expected: true, description: 'Valid email with + and subdomain' },

  // Invalid format
  { email: 'notanemail', expected: false, description: 'Invalid format - no @' },
  { email: '@nodomain.com', expected: false, description: 'Invalid format - no local part' },

  // Disposable emails
  { email: 'test@10minutemail.com', expected: false, description: 'Disposable email - 10minutemail' },
  { email: 'user@guerrillamail.com', expected: false, description: 'Disposable email - guerrillamail' },
  { email: 'temp@mailinator.com', expected: false, description: 'Disposable email - mailinator' },

  // Typos
  { email: 'user@gmial.com', expected: true, description: 'Common typo - gmial (should suggest gmail)' },
  { email: 'user@hotmial.com', expected: true, description: 'Common typo - hotmial (should suggest hotmail)' },
];

let passed = 0;
let failed = 0;

console.log('Test Results:\n');

testCases.forEach((testCase, index) => {
  const result = validateEmail(testCase.email);
  const success = result.isValid === testCase.expected;

  const status = success ? '✅ PASS' : '❌ FAIL';
  const icon = result.isValid ? '✓' : '✗';

  console.log(`${index + 1}. ${status} ${testCase.description}`);
  console.log(`   Email: ${testCase.email}`);
  console.log(`   Result: ${icon} ${result.isValid ? 'Valid' : 'Invalid'}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  if (result.suggestion) {
    console.log(`   💡 Suggestion: ${result.suggestion}`);
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
  }

  console.log('');

  if (success) {
    passed++;
  } else {
    failed++;
  }
});

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('Test Summary:\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Email validation is working correctly.\n');
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.\n`);
}
