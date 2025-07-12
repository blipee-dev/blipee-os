#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

// Test templates for different file types
const TEST_TEMPLATES = {
  component: (name, importPath) => `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { ${name} } from '${importPath}';

describe('${name}', () => {
  // Rendering tests
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<${name} />);
      expect(container).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(<${name} />);
      expect(container).toMatchSnapshot();
    });
  });

  // Props tests
  describe('Props', () => {
    it('should handle all prop combinations', () => {
      // Add specific prop tests based on component
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('should handle user interactions correctly', async () => {
      const user = userEvent.setup();
      // Add interaction tests
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<${name} />);
      // Add axe-core tests
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      // Add keyboard navigation tests
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle error states gracefully', () => {
      // Add error handling tests
    });

    it('should handle loading states', () => {
      // Add loading state tests
    });
  });

  // Performance
  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      // Add performance tests
    });
  });
});
`,

  service: (name, importPath) => `import { jest } from '@jest/globals';
import { ${name} } from '${importPath}';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('${name}', () => {
  let service: ${name};

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ${name}();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      expect(service).toBeDefined();
    });

    it('should handle configuration options', () => {
      // Add configuration tests
    });
  });

  describe('Core Functionality', () => {
    it('should perform primary function correctly', async () => {
      // Add core functionality tests
    });

    it('should handle concurrent operations', async () => {
      // Add concurrency tests
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Add network error tests
    });

    it('should handle invalid input', async () => {
      // Add validation tests
    });

    it('should retry failed operations', async () => {
      // Add retry logic tests
    });
  });

  describe('Security', () => {
    it('should sanitize user input', () => {
      // Add input sanitization tests
    });

    it('should handle authentication correctly', async () => {
      // Add auth tests
    });
  });

  describe('Performance', () => {
    it('should cache results appropriately', async () => {
      // Add caching tests
    });

    it('should handle rate limiting', async () => {
      // Add rate limiting tests
    });
  });

  describe('Integration', () => {
    it('should integrate with external services', async () => {
      // Add integration tests
    });
  });
});
`,

  api: (name, route) => `import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from '${route}';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@/lib/auth/auth-service');

describe('${name} API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET ${route}', () => {
    it('should return 200 for valid requests', async () => {
      const request = new NextRequest('http://localhost:3000${route}');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('should handle query parameters', async () => {
      const request = new NextRequest('http://localhost:3000${route}?limit=10&offset=0');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthorized requests', async () => {
      // Mock unauthorized user
      const request = new NextRequest('http://localhost:3000${route}');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });

    it('should handle errors gracefully', async () => {
      // Mock error scenario
      const request = new NextRequest('http://localhost:3000${route}');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('POST ${route}', () => {
    it('should create resource successfully', async () => {
      const body = { /* test data */ };
      const request = new NextRequest('http://localhost:3000${route}', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should validate request body', async () => {
      const invalidBody = { /* invalid data */ };
      const request = new NextRequest('http://localhost:3000${route}', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Security', () => {
    it('should enforce rate limiting', async () => {
      // Test rate limiting
    });

    it('should validate CORS headers', async () => {
      // Test CORS
    });

    it('should sanitize input data', async () => {
      // Test input sanitization
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      const request = new NextRequest('http://localhost:3000${route}');
      await GET(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // 1 second max
    });
  });
});
`
};

async function generateTestsForFile(filePath, testDir) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const isComponent = filePath.includes('/components/');
  const isApi = filePath.includes('/api/');
  const isService = filePath.includes('/lib/') && !isComponent;
  
  let testContent;
  let testFileName;
  
  if (isComponent) {
    testContent = TEST_TEMPLATES.component(baseName, `./${baseName}`);
    testFileName = `${baseName}.test${ext}`;
  } else if (isApi) {
    const route = filePath.replace(/.*\/api/, '/api').replace('/route.ts', '');
    testContent = TEST_TEMPLATES.api(baseName, route);
    testFileName = `${baseName}.test.ts`;
  } else if (isService) {
    testContent = TEST_TEMPLATES.service(baseName, `./${baseName}`);
    testFileName = `${baseName}.test.ts`;
  } else {
    return null;
  }
  
  const testPath = path.join(testDir, testFileName);
  
  // Check if test already exists
  try {
    await fs.access(testPath);
    console.log(`⏭️  Test already exists: ${testPath}`);
    return null;
  } catch {
    // Test doesn't exist, create it
    await fs.writeFile(testPath, testContent);
    console.log(`✅ Generated test: ${testPath}`);
    return testPath;
  }
}

async function main() {
  console.log('🏗️  Fortune 10 Test Generator');
  console.log('============================\n');
  
  // Find all source files that need tests
  const sourcePatterns = [
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/app/api/**/route.ts'
  ];
  
  const ignorePatterns = [
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/test/**',
    '**/*.d.ts'
  ];
  
  let totalGenerated = 0;
  
  for (const pattern of sourcePatterns) {
    const files = await glob(pattern, { ignore: ignorePatterns });
    
    for (const file of files) {
      const dir = path.dirname(file);
      const testDir = path.join(dir, '__tests__');
      
      // Create test directory if it doesn't exist
      await fs.mkdir(testDir, { recursive: true });
      
      const generated = await generateTestsForFile(file, testDir);
      if (generated) {
        totalGenerated++;
      }
    }
  }
  
  console.log(`\n📊 Summary: Generated ${totalGenerated} new test files`);
  console.log('\n💡 Next steps:');
  console.log('1. Review and customize the generated tests');
  console.log('2. Add specific test cases for your business logic');
  console.log('3. Run: npm test to verify all tests pass');
  console.log('4. Run: npm run test:coverage to check coverage');
}

main().catch(console.error);