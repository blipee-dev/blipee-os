import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFiles: ['<rootDir>/jest.env.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.enterprise.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '@supabase/supabase-js': '<rootDir>/__mocks__/@supabase/supabase-js.js',
    '@supabase/ssr': '<rootDir>/src/test/mocks/supabase-ssr.js',
    'isows': '<rootDir>/src/test/mocks/isows-esm.js',
    'openai': '<rootDir>/src/test/mocks/openai-esm.js',
    '@anthropic-ai/sdk': '<rootDir>/src/test/mocks/anthropic-esm.js',
    'ioredis': '<rootDir>/src/test/mocks/redis-esm.js',
    'graphql-ws': '<rootDir>/src/test/mocks/graphql-ws.js',
    'ws': '<rootDir>/src/test/mocks/ws.js',
    '@radix-ui/react-slot': '<rootDir>/src/test/mocks/radix-slot.js'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: false,
          dynamicImport: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|openai|@simplewebauthn|@anthropic-ai|ws|node-fetch|graphql-ws|uuid|nanoid)/)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/cypress/', 
    '/.skip.test.'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/test/**',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'text-summary', 'json-summary'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  maxWorkers: '50%',
  bail: false,
  verbose: true,
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);