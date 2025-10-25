const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('📦 Applying SBTi compliance migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251009_complete_sbti_compliance.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log(`   Size: ${sql.length} characters\n`);

    // Split into individual statements (rough split by semicolons not in quotes)
    const statements = sql
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/g)
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      // Extract a description from the statement
      const firstLine = stmt.split('\n')[0].substring(0, 80);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

        if (error) {
          // Check if it's a "already exists" or benign error
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')
          ) {
            console.log(`⚠️  ${i + 1}/${statements.length} Skipped (already exists): ${firstLine}`);
            skipCount++;
          } else {
            console.log(`❌ ${i + 1}/${statements.length} Error: ${firstLine}`);
            console.log(`   ${error.message}\n`);
            errorCount++;
          }
        } else {
          console.log(`✅ ${i + 1}/${statements.length} Success: ${firstLine}`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ ${i + 1}/${statements.length} Exception: ${firstLine}`);
        console.log(`   ${err.message}\n`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (err) {
    console.log('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
