#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

console.log('🔧 Fixing TypeScript Errors\n');

// Fix 1: Remove unused variables
const removeUnusedVars = (content: string, file: string): string => {
  // Common unused variables patterns
  const fixes: Record<string, string> = {
    // Remove unused request parameter
    'async function POST(request: NextRequest)': 'async function POST()',
    'async function GET(request: NextRequest)': 'async function GET()',
    'async function PUT(request: NextRequest)': 'async function PUT()',
    'async function DELETE(request: NextRequest)': 'async function DELETE()',
    
    // Fix unused organizationId
    'const { organizationId, startDate, endDate }': 'const { startDate, endDate }',
    
    // Fix unused destructured variables
    'const { site, siteData }': 'const { }',
  };

  let fixed = content;
  for (const [search, replace] of Object.entries(fixes)) {
    if (fixed.includes(search)) {
      fixed = fixed.replace(search, replace);
      console.log(`  ✓ Fixed unused variable in ${path.basename(file)}`);
    }
  }

  return fixed;
};

// Fix 2: Replace UserRole.SUBSCRIPTION_OWNER with correct enum
const fixUserRoles = (content: string, file: string): string => {
  if (content.includes('UserRole.SUBSCRIPTION_OWNER')) {
    const fixed = content.replace(/UserRole\.SUBSCRIPTION_OWNER/g, "'account_owner'");
    console.log(`  ✓ Fixed UserRole enum in ${path.basename(file)}`);
    return fixed;
  }
  return content;
};

// Fix 3: Fix auth.users references
const fixAuthUsers = (content: string, file: string): string => {
  if (content.includes("from('auth.users')")) {
    // Auth tables need to be accessed differently
    const fixed = content.replace(
      /supabase\s*\.\s*from\s*\(\s*['"]auth\.users['"]\s*\)/g,
      "supabase.auth.admin.listUsers()"
    );
    console.log(`  ✓ Fixed auth.users reference in ${path.basename(file)}`);
    return fixed;
  }
  return content;
};

// Fix 4: Fix error reference
const fixErrorReference = (content: string, file: string): string => {
  if (content.includes('console.error(error)') && !content.includes('catch')) {
    const fixed = content.replace(
      'console.error(error)',
      'console.error("Error generating report")'
    );
    console.log(`  ✓ Fixed error reference in ${path.basename(file)}`);
    return fixed;
  }
  return content;
};

// Fix 5: Fix emission source types
const fixEmissionTypes = (content: string, file: string): string => {
  if (content.includes('source_id: source.id')) {
    const fixed = content.replace(
      'source_id: source.id',
      'source_id: source.id || null'
    );
    console.log(`  ✓ Fixed emission types in ${path.basename(file)}`);
    return fixed;
  }
  return content;
};

// Process files
const processFile = (filePath: string) => {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  content = removeUnusedVars(content, filePath);
  content = fixUserRoles(content, filePath);
  content = fixAuthUsers(content, filePath);
  content = fixErrorReference(content, filePath);
  content = fixEmissionTypes(content, filePath);

  if (content !== original) {
    writeFileSync(filePath, content);
  }
};

// Target files with errors
const errorFiles = [
  'src/app/api/auth/mfa/disable/route.ts',
  'src/app/api/auth/sso/configurations/[id]/route.ts',
  'src/app/api/auth/sso/configurations/[id]/test/route.ts',
  'src/app/api/auth/sso/configurations/route.ts',
  'src/app/api/auth/sso/logout/route.ts',
  'src/app/api/auth/webauthn/auth/options/route.ts',
  'src/app/api/auth/webauthn/auth/verify/route.ts',
  'src/app/api/auth/webauthn/register/options/route.ts',
  'src/app/api/auth/webauthn/stats/route.ts',
  'src/app/api/documents/sustainability-report/route.ts',
  'src/app/api/emissions/bulk/route.ts',
  'src/app/api/files/upload/route.ts',
];

console.log('Processing files with TypeScript errors...\n');

errorFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  try {
    processFile(fullPath);
  } catch (error) {
    console.error(`  ✗ Error processing ${file}:`, error);
  }
});

console.log('\n✨ Done! Run npm run type-check to see remaining errors.');