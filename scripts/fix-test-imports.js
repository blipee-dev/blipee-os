#!/usr/bin/env node

/**
 * Fix common test import issues
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

async function fixTestImports() {
  console.log('🔧 Fixing test import issues...\n');
  
  const testFiles = await glob('src/**/*.test.{ts,tsx}', { 
    ignore: ['node_modules/**']
  });
  
  let fixedCount = 0;
  
  for (const file of testFiles) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      let modified = false;
      
      // Fix BuildingSelector imports
      if (content.includes("from './BuildingSelector'") && file.includes('__tests__')) {
        content = content.replace("from './BuildingSelector'", "from '../BuildingSelector'");
        modified = true;
      }
      
      // Fix component imports in __tests__ folders
      if (file.includes('__tests__') && content.includes("from './")) {
        // Check if it's trying to import a component from current directory
        const componentImports = content.match(/from '\.\/([\w]+)'/g);
        if (componentImports) {
          componentImports.forEach(imp => {
            const componentName = imp.match(/from '\.\/([\w]+)'/)[1];
            // Skip if it's a test utility file
            if (!componentName.includes('test') && !componentName.includes('mock')) {
              content = content.replace(imp, `from '../${componentName}'`);
              modified = true;
            }
          });
        }
      }
      
      // Add mock for framer-motion if it's used but not mocked
      if (content.includes('framer-motion') && !content.includes("jest.mock('framer-motion")
          && !content.includes("jest.mock('@/test/mocks/framer-motion")) {
        const mockCode = `
// Mock framer-motion
jest.mock('framer-motion', () => require('@/test/mocks/framer-motion'));
`;
        // Insert after other jest.mock statements or after imports
        const lastMockIndex = content.lastIndexOf("jest.mock(");
        if (lastMockIndex > -1) {
          const endOfLine = content.indexOf('\n', lastMockIndex);
          content = content.slice(0, endOfLine + 1) + mockCode + content.slice(endOfLine + 1);
        } else {
          // Insert after imports
          const lastImportIndex = content.lastIndexOf('import ');
          const endOfImport = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfImport + 1) + '\n' + mockCode + content.slice(endOfImport + 1);
        }
        modified = true;
      }
      
      // Fix Next.js mocks for API routes
      if (content.includes('NextRequest') || content.includes('NextResponse')) {
        if (!content.includes('global.Request') && !content.includes('global.Response')) {
          const nextMock = `
// Mock Next.js Request/Response
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};
`;
          // Add after imports but before describes
          const describeIndex = content.indexOf('describe(');
          if (describeIndex > -1) {
            content = content.slice(0, describeIndex) + nextMock + '\n' + content.slice(describeIndex);
            modified = true;
          }
        }
      }
      
      // Fix relative imports in test files
      if (content.includes("from '../") && file.includes('__tests__')) {
        const depth = file.split('/').filter(p => p === '__tests__').length;
        if (depth > 0) {
          // Adjust import paths based on depth
          content = content.replace(/from '\.\.\/([^']+)'/g, (match, path) => {
            if (path.startsWith('../')) {
              return match; // Already adjusted
            }
            return `from '../${path}'`;
          });
          modified = true;
        }
      }
      
      if (modified) {
        await fs.writeFile(file, content);
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary: Fixed ${fixedCount} test files`);
}

// Also create a jest setup file for global mocks
async function createGlobalMocks() {
  const globalMocksContent = `// Global mocks for all tests

// Mock Next.js Request/Response
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
`;

  await fs.writeFile(path.join(process.cwd(), 'src/test/setup/global-mocks.js'), globalMocksContent);
  console.log('✅ Created global mocks file');
}

async function main() {
  await fixTestImports();
  await createGlobalMocks();
  
  console.log('\n💡 Next steps:');
  console.log('1. Update jest.setup.js to import global mocks');
  console.log('2. Run tests again to see improved results');
}

main().catch(console.error);