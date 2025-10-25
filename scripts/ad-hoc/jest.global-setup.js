// Global setup for Jest tests
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // Create test directories
  const testKeyPath = path.join(__dirname, '.test-keys');
  if (!fs.existsSync(testKeyPath)) {
    fs.mkdirSync(testKeyPath, { recursive: true });
  }

  const testResultsPath = path.join(__dirname, 'test-results');
  if (!fs.existsSync(testResultsPath)) {
    fs.mkdirSync(testResultsPath, { recursive: true });
  }

  // Set up test database or mock services if needed
  console.log('🧪 Setting up test environment...');
  
  // Initialize any global test resources
  global.__TEST_START_TIME__ = Date.now();
  
  // Set up test-specific environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
  
  console.log('✅ Test environment setup complete');
};