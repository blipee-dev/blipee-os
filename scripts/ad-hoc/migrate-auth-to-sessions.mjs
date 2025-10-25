#!/usr/bin/env node
/**
 * Migration script to replace JWT-based auth with session-based auth
 *
 * This script updates all API routes to use the new session-based authentication
 * by replacing supabase.auth.getUser() with getAPIUser(request)
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;

    // Skip if already uses getAPIUser
    if (content.includes('getAPIUser')) {
      console.log(`⏭️  SKIP: ${filePath} (already migrated)`);
      return { modified: false, filePath };
    }

    // Pattern 1: const supabase = await createClient()
    // Pattern 2: const { data: { user }, error } = await supabase.auth.getUser()

    const hasCreateClient = content.includes('createClient()');
    const hasGetUser = content.includes('supabase.auth.getUser()');

    if (!hasGetUser) {
      console.log(`⏭️  SKIP: ${filePath} (no auth check)`);
      return { modified: false, filePath };
    }

    // Add import for getAPIUser if not present
    if (!content.includes("from '@/lib/auth/server-auth'")) {
      // Find existing imports
      const importMatch = content.match(/^import.*from ['"]next\/server['"];?\n/m);
      if (importMatch) {
        const insertAfter = importMatch[0];
        content = content.replace(
          insertAfter,
          insertAfter + "import { getAPIUser } from '@/lib/auth/server-auth';\n"
        );
        modified = true;
      }
    }

    // Remove createClient import if it's only used for auth
    const createClientImportRegex = /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"];?\n/;

    // Replace auth check pattern
    const authPatterns = [
      // Pattern: const supabase = await createClient();
      //          const { data: { user }, error } = await supabase.auth.getUser();
      {
        search: /const\s+supabase\s*=\s*await\s+createClient\(\);?\s*\n\s*(?:\/\/[^\n]*\n\s*)*const\s*{\s*data:\s*{\s*user\s*},?\s*error\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*\n/g,
        replace: '// Get authenticated user using session-based auth\n    const user = await getAPIUser(request);\n\n'
      },
      // Pattern: const supabase = await createClient();
      //          const { data: { user } } = await supabase.auth.getUser();
      {
        search: /const\s+supabase\s*=\s*await\s+createClient\(\);?\s*\n\s*(?:\/\/[^\n]*\n\s*)*const\s*{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*\n/g,
        replace: '// Get authenticated user using session-based auth\n    const user = await getAPIUser(request);\n\n'
      },
    ];

    for (const pattern of authPatterns) {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
      }
    }

    // Replace error checks
    content = content.replace(
      /if\s*\(\s*error\s*\|\|\s*!user\s*\)\s*{/g,
      'if (!user) {'
    );
    content = content.replace(
      /if\s*\(\s*!user\s*\|\|\s*error\s*\)\s*{/g,
      'if (!user) {'
    );

    // Check if createClient is still used elsewhere in the file
    const supabaseUsageRegex = /supabase\.(from|rpc|storage)/;
    if (!supabaseUsageRegex.test(content)) {
      // Remove createClient import if not used
      content = content.replace(createClientImportRegex, '');
    }

    if (modified) {
      if (!DRY_RUN) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ MIGRATED: ${filePath}`);
      } else {
        console.log(`🔍 DRY RUN - Would migrate: ${filePath}`);
      }
      return { modified: true, filePath, originalContent, newContent: content };
    }

    return { modified: false, filePath };

  } catch (error) {
    console.error(`❌ ERROR: ${filePath}`, error.message);
    return { error: true, filePath, message: error.message };
  }
}

async function main() {
  console.log('🚀 Starting auth migration to session-based auth...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Find all API route files
  const files = await glob('src/app/api/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts']
  });

  console.log(`📁 Found ${files.length} API route files\n`);

  const results = {
    migrated: [],
    skipped: [],
    errors: []
  };

  for (const file of files) {
    const result = await migrateFile(file);

    if (result.error) {
      results.errors.push(result);
    } else if (result.modified) {
      results.migrated.push(result);
    } else {
      results.skipped.push(result);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Migrated: ${results.migrated.length}`);
  console.log(`⏭️  Skipped:  ${results.skipped.length}`);
  console.log(`❌ Errors:   ${results.errors.length}`);
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
