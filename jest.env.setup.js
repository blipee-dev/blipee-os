/**
 * Jest Environment Setup
 *
 * Sets up environment variables for Jest tests
 */

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';

// Suppress console warnings in tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // Filter out specific warnings if needed
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render') ||
     message.includes('Warning: useLayoutEffect'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  // Filter out specific errors if needed
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
     message.includes('Error: Uncaught'))
  ) {
    return;
  }
  originalError.apply(console, args);
};
