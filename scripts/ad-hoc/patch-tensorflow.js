// Patch for TensorFlow.js compatibility with Node.js v24
// The issue is that util.isNullOrUndefined was removed in newer Node versions

const util = require('util');

// Add the missing function if it doesn't exist
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = function(arg) {
    return arg === null || arg === undefined;
  };
}

console.log('✅ TensorFlow.js patched for Node.js v24 compatibility');