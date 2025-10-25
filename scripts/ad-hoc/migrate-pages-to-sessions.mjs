#!/usr/bin/env node
/**
 * Migration script to replace JWT-based auth with session-based auth in Server Components
 *
 * This script updates all page.tsx files to use the new session-based authentication
 * by replacing supabase.auth.getUser() with requireServerAuth()
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    // Skip if already uses requireServerAuth or getServerUser
    if (content.includes('requireServerAuth') || content.includes('getServerUser')) {
      console.log(`⏭️  SKIP: ${filePath} (already migrated)`);
      return { modified: false, filePath };
    }

    const hasGetUser = content.includes('supabase.auth.getUser()');

    if (!hasGetUser) {
      console.log(`⏭️  SKIP: ${filePath} (no auth check)`);
      return { modified: false, filePath };
    }

    // Add import for requireServerAuth if not present
    if (!content.includes("from '@/lib/auth/server-auth'")) {
      // Find first import statement
      const firstImportMatch = content.match(/^import.*from.*;\n/m);
      if (firstImportMatch) {
        const insertAfter = firstImportMatch[0];
        content = content.replace(
          insertAfter,
          insertAfter + "import { requireServerAuth } from '@/lib/auth/server-auth';\n"
        );
        modified = true;
      }
    }

    // Replace auth check pattern for Server Components
    // Pattern: const supabase = await createServerSupabaseClient();
    //          const { data: { user }, error } = await supabase.auth.getUser();
    //          if (error || !user) { redirect('/signin'); }

    content = content.replace(
      /const\s+supabase\s*=\s*await\s+createServerSupabaseClient\(\);?\s*\n\s*(?:\/\/[^\n]*\n\s*)*const\s*{\s*data:\s*{\s*user\s*},?\s*error\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*\n\s*if\s*\(\s*error\s*\|\|\s*!user\s*\)\s*{[^}]*}\s*\n/g,
      '// Check authentication using session-based auth\n  const user = await requireServerAuth(\'/signin?redirect=\' + request.url);\n\n'
    );

    // Simpler pattern without redirect
    content = content.replace(
      /const\s+supabase\s*=\s*await\s+createServerSupabaseClient\(\);?\s*\n\s*(?:\/\/[^\n]*\n\s*)*const\s*{\s*data:\s*{\s*user\s*},?\s*error\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*\n/g,
      '// Get authenticated user using session-based auth\n  const user = await requireServerAuth();\n\n'
    );

    // Pattern without error variable
    content = content.replace(
      /const\s+supabase\s*=\s*await\s+createClient\(\);?\s*\n\s*(?:\/\/[^\n]*\n\s*)*const\s*{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);?\s*\n/g,
      '// Get authenticated user using session-based auth\n  const user = await requireServerAuth();\n\n'
    );

    // Remove createServerSupabaseClient import if not used elsewhere
    const supabaseUsageRegex = /supabase\.(from|rpc|storage)/;
    if (!supabaseUsageRegex.test(content)) {
      content = content.replace(
        /import\s*{\s*createServerSupabaseClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"];?\n/g,
        ''
      );
      content = content.replace(
        /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"];?\n/g,
        ''
      );
    }

    if (content !== await fs.readFile(filePath, 'utf-8')) {
      modified = true;

      if (!DRY_RUN) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ MIGRATED: ${filePath}`);
      } else {
        console.log(`🔍 DRY RUN - Would migrate: ${filePath}`);
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
  console.log('🚀 Starting page migration to session-based auth...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Find all page.tsx files
  const files = await glob('src/app/**/page.tsx', {
    ignore: ['**/node_modules/**']
  });

  console.log(`📁 Found ${files.length} page files\n`);

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
