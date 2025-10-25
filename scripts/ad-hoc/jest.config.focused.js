const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.minimal.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '@supabase/supabase-js': '<rootDir>/src/test/mocks/supabase.js',
    'isows': '<rootDir>/src/test/mocks/isows.js',
    'openai': '<rootDir>/src/test/mocks/openai.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|openai|@simplewebauthn|@anthropic-ai|ws|node-fetch)/)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/cypress/', 
    '/.skip.test.',
  ],
  collectCoverageFrom: [
    'src/lib/utils.ts',
    'src/lib/design/glass-morphism.ts',
    'src/lib/design/theme.ts',
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
    'src/components/premium/GlassCard.tsx',
    'src/components/premium/GradientButton.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,  
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'text-summary'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);