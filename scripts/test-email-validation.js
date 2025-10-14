/**
 * Test Email Validation Service
 * Tests various email validation scenarios
 */

const { validateEmail, extractAndValidateEmails } = require('../src/lib/auth/email-validator.ts');

console.log('🧪 Testing Email Validation Service\n');
console.log('═══════════════════════════════════════════════════\n');

// Test cases
const testCases = [
  // Valid emails
  { email: 'user@company.com', expected: true, description: 'Valid business email' },
  { email: 'test.user+tag@example.co.uk', expected: true, description: 'Valid email with + and subdomain' },

  // Invalid format
  { email: 'notanemail', expected: false, description: 'Invalid format - no @' },
  { email: 'missing@domain', expected: false, description: 'Invalid format - no TLD' },
  { email: '@nodomain.com', expected: false, description: 'Invalid format - no local part' },

  // Disposable emails
  { email: 'test@10minutemail.com', expected: false, description: 'Disposable email - 10minutemail' },
  { email: 'user@guerrillamail.com', expected: false, description: 'Disposable email - guerrillamail' },
  { email: 'temp@mailinator.com', expected: false, description: 'Disposable email - mailinator' },

  // Typos
  { email: 'user@gmial.com', expected: true, description: 'Common typo - gmial (should suggest gmail)' },
  { email: 'user@hotmial.com', expected: true, description: 'Common typo - hotmial (should suggest hotmail)' },
  { email: 'user@yahooo.com', expected: true, description: 'Common typo - yahooo (should suggest yahoo)' },

  // Free emails (business check)
  { email: 'user@gmail.com', expected: true, description: 'Free email - gmail' },
  { email: 'user@yahoo.com', expected: true, description: 'Free email - yahoo' },
  { email: 'user@outlook.com', expected: true, description: 'Free email - outlook' },
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

// Test business email requirement
console.log('\n═══════════════════════════════════════════════════');
console.log('Testing Business Email Requirement:\n');

const businessEmailTests = [
  { email: 'user@gmail.com', requireBusiness: true, shouldPass: false },
  { email: 'user@company.com', requireBusiness: true, shouldPass: true },
  { email: 'admin@startup.io', requireBusiness: true, shouldPass: true },
];

businessEmailTests.forEach((test, index) => {
  const result = validateEmail(test.email, test.requireBusiness);
  const success = result.isValid === test.shouldPass;
  const status = success ? '✅ PASS' : '❌ FAIL';

  console.log(`${index + 1}. ${status} ${test.email} (require business: ${test.requireBusiness})`);
  console.log(`   Expected: ${test.shouldPass ? 'Valid' : 'Invalid'}, Got: ${result.isValid ? 'Valid' : 'Invalid'}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  console.log('');

  if (success) {
    passed++;
  } else {
    failed++;
  }
});

// Test bulk validation
console.log('\n═══════════════════════════════════════════════════');
console.log('Testing Bulk Email Validation:\n');

const bulkEmails = `
user1@company.com,
test@10minutemail.com,
admin@gmial.com,
notanemail,
user2@business.org
`;

const bulkResult = extractAndValidateEmails(bulkEmails);

console.log('Bulk Email Results:');
console.log(`✅ Valid emails: ${bulkResult.valid.length}`);
bulkResult.valid.forEach(email => console.log(`   - ${email}`));

console.log(`\n❌ Invalid emails: ${bulkResult.invalid.length}`);
bulkResult.invalid.forEach(({ email, error }) => console.log(`   - ${email}: ${error}`));

console.log(`\n💡 Suggestions: ${bulkResult.suggestions.length}`);
bulkResult.suggestions.forEach(({ original, suggested }) =>
  console.log(`   - ${original} → ${suggested}`)
);

// Summary
console.log('\n═══════════════════════════════════════════════════');
console.log('Test Summary:\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Email validation is working correctly.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.\n`);
  process.exit(1);
}
