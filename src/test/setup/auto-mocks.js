// Auto-generated mocks for external dependencies

// Mock all image imports
jest.mock('*.png', () => 'test-image.png');
jest.mock('*.jpg', () => 'test-image.jpg');
jest.mock('*.svg', () => 'test-image.svg');

// Mock CSS modules
jest.mock('*.module.css', () => ({}));
jest.mock('*.module.scss', () => ({}));

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  NODE_ENV: 'test'
};
