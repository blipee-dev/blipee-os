/**
 * Test Constants
 * Centralized test data to avoid hardcoded values
 */

export const TEST_CREDENTIALS = {
  password: process.env.TEST_PASSWORD || 'SecurePass123!',
  email: 'test@example.com',
  adminEmail: 'admin@example.com',
  organizationName: 'Test Company'
} as const;

export const TEST_API_KEYS = {
  openai: process.env.TEST_OPENAI_KEY || 'sk-test-key',
  supabase: process.env.TEST_SUPABASE_KEY || 'test-key'
} as const;

export const TEST_URLS = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.TEST_API_URL || 'http://localhost:3000/api'
} as const;