// Global teardown for Jest tests
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // Clean up test directories
  const testKeyPath = path.join(__dirname, '.test-keys');
  if (fs.existsSync(testKeyPath)) {
    fs.rmSync(testKeyPath, { recursive: true, force: true });
  }

  // Clean up any test resources
  console.log('🧹 Cleaning up test environment...');
  
  // Calculate test duration
  const testDuration = Date.now() - (global.__TEST_START_TIME__ || 0);
  console.log(`⏱️  Total test duration: ${testDuration}ms`);
  
  // Clean up any global resources
  if (global.__TEST_RESOURCES__) {
    // Clean up any resources that were created during tests
    global.__TEST_RESOURCES__.forEach(resource => {
      if (typeof resource.cleanup === 'function') {
        resource.cleanup();
      }
    });
  }
  
  console.log('✅ Test environment cleanup complete');
};