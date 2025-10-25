#!/usr/bin/env node
/**
 * Fix remaining JWT-based auth calls that were missed by the first migration
 * This handles various patterns and edge cases
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    let modified = false;

    // Skip if this is a utility that's meant to accept a client parameter
    if (filePath.includes('/lib/auth/get-user-org.ts') ||
        filePath.includes('/lib/auth/permission-service.ts') ||
        filePath.includes('/lib/auth/service.ts') ||
        filePath.includes('/lib/auth/sso/service.ts') ||
        filePath.includes('/lib/auth/session.ts') ||
        filePath.includes('/lib/auth/session-auth.ts') ||
        filePath.includes('/lib/auth/service-v2.ts') ||
        filePath.includes('/lib/auth/server-auth.ts') ||
        filePath.includes('/lib/supabase/')) {
      console.log(`⏭️  SKIP: ${filePath} (utility file)`);
      return { modified: false, filePath };
    }

    // Skip client components (they should use useAuth hook)
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log(`⏭️  SKIP: ${filePath} (client component)`);
      return { modified: false, filePath };
    }

    // Check if has getUser() call
    const hasGetUser = content.includes('supabase.auth.getUser()');
    if (!hasGetUser) {
      console.log(`⏭️  SKIP: ${filePath} (no auth check)`);
      return { modified: false, filePath };
    }

    // Check if already fixed
    if (content.includes('getAPIUser') || content.includes('requireServerAuth')) {
      // But still has supabase.auth.getUser - needs fixing
      if (hasGetUser) {
        console.log(`🔧 FIXING: ${filePath} (has both old and new)`);
      } else {
        console.log(`⏭️  SKIP: ${filePath} (already migrated)`);
        return { modified: false, filePath };
      }
    }

    // Determine if this is an API route or page
    const isAPIRoute = filePath.includes('/app/api/');
    const isPage = filePath.includes('page.tsx');

    if (isAPIRoute) {
      // Add import if not present
      if (!content.includes("from '@/lib/auth/server-auth'")) {
        const firstImport = content.match(/^import.*from.*;\n/m);
        if (firstImport) {
          content = content.replace(
            firstImport[0],
            firstImport[0] + "import { getAPIUser } from '@/lib/auth/server-auth';\n"
          );
          modified = true;
        }
      }

      // Replace all variations of auth checks
      // Pattern 1: with error variable
      content = content.replace(
        /const\s*{\s*data:\s*{\s*user\s*},?\s*error:\s*\w+\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*/g,
        'const user = await getAPIUser(request);\n    '
      );

      // Pattern 2: without error variable
      content = content.replace(
        /const\s*{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*/g,
        'const user = await getAPIUser(request);\n    '
      );

      // Remove supabase client creation if not used elsewhere
      const lines = content.split('\n');
      const supabaseLineRegex = /const\s+supabase\s*=\s*await\s+(createClient|createServerSupabaseClient)\(\);?/;
      const hasOtherSupabaseUse = /supabase\.(from|rpc|storage|channel)/.test(content);

      if (!hasOtherSupabaseUse) {
        content = lines.filter(line => !supabaseLineRegex.test(line)).join('\n');
      }

      // Fix error checks
      content = content.replace(
        /if\s*\(\s*(authError|error)\s*\|\|\s*!user\s*\)/g,
        'if (!user)'
      );
      content = content.replace(
        /if\s*\(\s*!user\s*\|\|\s*(authError|error)\s*\)/g,
        'if (!user)'
      );

      modified = true;

    } else if (isPage) {
      // Add import if not present
      if (!content.includes("from '@/lib/auth/server-auth'")) {
        const firstImport = content.match(/^import.*from.*;\n/m);
        if (firstImport) {
          content = content.replace(
            firstImport[0],
            firstImport[0] + "import { requireServerAuth } from '@/lib/auth/server-auth';\n"
          );
          modified = true;
        }
      }

      // Replace auth checks
      content = content.replace(
        /const\s*{\s*data:\s*{\s*user\s*},?\s*error:\?(\s*\w+)?\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*/g,
        'const user = await requireServerAuth();\n  '
      );

      // Remove client creation
      const hasOtherSupabaseUse = /supabase\.(from|rpc|storage|channel)/.test(content);
      if (!hasOtherSupabaseUse) {
        content = content.replace(
          /const\s+supabase\s*=\s*await\s+(createClient|createServerSupabaseClient)\(\);?\s*\n/g,
          ''
        );
      }

      modified = true;
    }

    if (content !== originalContent) {
      modified = true;
      if (!DRY_RUN) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ FIXED: ${filePath}`);
      } else {
        console.log(`🔍 DRY RUN - Would fix: ${filePath}`);
      }
      return { modified: true, filePath };
    }

    return { modified: false, filePath };

  } catch (error) {
    console.error(`❌ ERROR: ${filePath}`, error.message);
    return { error: true, filePath, message: error.message };
  }
}

async function main() {
  console.log('🔧 Fixing remaining JWT auth patterns...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Find all TypeScript files in src
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts']
  });

  console.log(`📁 Found ${files.length} files\n`);

  const results = {
    fixed: [],
    skipped: [],
    errors: []
  };

  for (const file of files) {
    const result = await fixFile(file);

    if (result.error) {
      results.errors.push(result);
    } else if (result.modified) {
      results.fixed.push(result);
    } else {
      results.skipped.push(result);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Fixed:   ${results.fixed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors:  ${results.errors.length}`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log('\n❌ Files with errors:');
    results.errors.forEach(({ filePath, message }) => {
      console.log(`  - ${filePath}: ${message}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main().catch(console.error);
