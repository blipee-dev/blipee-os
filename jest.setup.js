// Jest setup file for security tests
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.ENCRYPTION_PROVIDER = 'local';
process.env.KEY_STORE_PATH = './.test-keys';

// Mock Web APIs that aren't available in Node.js
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  randomBytes: (size) => Buffer.alloc(size, 0),
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock WebAuthn APIs
global.navigator = {
  ...global.navigator,
  credentials: {
    create: jest.fn(),
    get: jest.fn(),
  },
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = jest.fn((...args) => {
  // Only show errors that aren't expected test errors
  if (!args[0]?.includes?.('expected test error')) {
    originalConsoleError(...args);
  }
});

console.warn = jest.fn((...args) => {
  // Only show warnings that aren't expected test warnings
  if (!args[0]?.includes?.('expected test warning')) {
    originalConsoleWarn(...args);
  }
});

// Mock Buffer for base64 operations
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock TextEncoder/TextDecoder for WebAuthn
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock btoa/atob for base64 operations
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process
  // process.exit(1);
});

// Mock Redis for testing
jest.mock('ioredis', () => {
  return {
    default: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      pipeline: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn(() => Promise.resolve([])),
      })),
      disconnect: jest.fn(),
    })),
  };
});

// Mock bcrypt for password hashing
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`hashed_${password}_${rounds}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash.includes(password))),
  genSalt: jest.fn((rounds) => Promise.resolve(`salt_${rounds}`)),
}));

// Mock speakeasy for TOTP
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    ascii: 'test-secret',
    base32: 'TESTSECRET123456',
    hex: 'test-hex',
  })),
  totp: jest.fn(() => '123456'),
  time: jest.fn(() => ({ T: 123456 })),
}));

// Mock qrcode for QR code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn((data) => Promise.resolve(`data:image/png;base64,${Buffer.from(data).toString('base64')}`)),
}));

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('mock-file-content')),
  rmSync: jest.fn(),
  readdirSync: jest.fn(() => ['key1.pem', 'key2.pem']),
}));

export default undefined;