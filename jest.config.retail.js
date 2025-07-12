const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.retail.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    // API route tests
    '<rootDir>/src/app/api/retail/**/__tests__/**/*.test.{ts,tsx}',
    // Component tests
    '<rootDir>/src/components/retail/**/__tests__/**/*.test.{ts,tsx}',
    // Library tests
    '<rootDir>/src/lib/modules/__tests__/**/retail*.test.{ts,tsx}',
    '<rootDir>/src/lib/modules/__tests__/**/registry.test.{ts,tsx}',
    '<rootDir>/src/lib/auth/__tests__/**/retail*.test.{ts,tsx}',
    '<rootDir>/src/lib/hooks/__tests__/**/useRetailAuth.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    // API Routes
    'src/app/api/retail/**/*.{ts,tsx}',
    '!src/app/api/retail/**/__tests__/**',
    
    // Components
    'src/components/retail/**/*.{ts,tsx}',
    '!src/components/retail/**/__tests__/**',
    
    // Module system
    'src/lib/modules/registry.ts',
    'src/lib/modules/retail-module.ts',
    'src/lib/modules/types.ts',
    
    // Auth
    'src/lib/auth/retail-permissions.ts',
    'src/lib/auth/retail-middleware.ts',
    
    // Hooks
    'src/lib/hooks/useRetailAuth.ts',
    
    // Exclude test files
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)