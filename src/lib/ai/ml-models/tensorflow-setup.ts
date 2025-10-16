/**
 * TensorFlow.js Setup for Node.js and Browser
 *
 * Uses browser version (@tensorflow/tfjs) with CPU backend for Node.js
 * This keeps bundle size small (~5MB) instead of tfjs-node (383MB)
 *
 * Trade-off: Slightly slower inference vs native C++ bindings
 * Benefit: Works in Vercel serverless functions (under 250MB limit)
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';

// Initialize CPU backend for Node.js environments
if (typeof window === 'undefined') {
  // We're in Node.js (serverless function)
  tf.setBackend('cpu').then(() => {
  }).catch((err) => {
    console.warn('⚠️  TensorFlow.js backend initialization failed:', err);
  });
} else {
  // We're in browser - use WebGL if available
  tf.ready().then(() => {
  });
}

// Re-export tf for use in other modules
export { tf };
export default tf;
