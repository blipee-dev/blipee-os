// Load test environment variables before any test runs
const dotenv = require('dotenv');
const path = require('path');

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Ensure critical environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'REDIS_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`Warning: ${varName} is not set in test environment`);
  }
});

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';