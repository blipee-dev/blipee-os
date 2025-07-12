#!/usr/bin/env node

/**
 * Fix Jest imports for ESM compatibility
 * Adds import { jest } from '@jest/globals' to test files that use jest
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

async function fixJestImports() {
  console.log('🔧 Fixing Jest imports for ESM compatibility...\n');
  
  // Find all test files
  const testFiles = await glob('src/**/*.test.{ts,tsx}', { 
    ignore: ['node_modules/**']
  });
  
  let fixedCount = 0;
  let alreadyFixedCount = 0;
  
  for (const file of testFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check if file uses jest
      if (!content.includes('jest.')) {
        continue;
      }
      
      // Check if already has the import
      if (content.includes("from '@jest/globals'")) {
        alreadyFixedCount++;
        continue;
      }
      
      // Add import at the top after other imports
      let newContent = content;
      
      // Find the position to insert the import
      const importMatches = content.match(/^import .* from .*/gm);
      if (importMatches && importMatches.length > 0) {
        // Add after the last import
        const lastImport = importMatches[importMatches.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;
        
        newContent = 
          content.slice(0, insertPosition) + 
          "\nimport { jest } from '@jest/globals';" +
          content.slice(insertPosition);
      } else {
        // No imports found, add at the beginning
        newContent = "import { jest } from '@jest/globals';\n" + content;
      }
      
      await fs.writeFile(file, newContent);
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Files fixed: ${fixedCount}`);
  console.log(`   - Already fixed: ${alreadyFixedCount}`);
  console.log(`   - Total test files: ${testFiles.length}`);
}

fixJestImports().catch(console.error);