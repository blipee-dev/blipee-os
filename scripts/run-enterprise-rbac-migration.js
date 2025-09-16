const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running Enterprise RBAC Migration...');
  console.log('================================================');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250116_enterprise_rbac_complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    // This is a simple split - for production, you'd want a more robust SQL parser
    const statements = migrationSQL
      .split(/;[\s]*\n/)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      // Extract a description from the statement
      let description = statement.substring(0, 50).replace(/\n/g, ' ');
      if (statement.length > 50) description += '...';

      process.stdout.write(`[${i + 1}/${statements.length}] Executing: ${description} `);

      try {
        // Execute the statement using RPC call
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).catch(err => {
          // If exec_sql doesn't exist, try direct execution
          return { error: err };
        });

        if (error) {
          console.log('❌');
          errorCount++;
          errors.push({
            statement: description,
            error: error.message || error
          });
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log('❌');
        errorCount++;
        errors.push({
          statement: description,
          error: err.message || err
        });
      }
    }

    console.log('');
    console.log('================================================');
    console.log('📊 Migration Results:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('');
      console.log('❌ Errors encountered:');
      errors.forEach(({ statement, error }) => {
        console.log(`   - ${statement}`);
        console.log(`     Error: ${error}`);
      });

      console.log('');
      console.log('⚠️  Some statements failed. This might be expected if:');
      console.log('   1. Tables/functions already exist');
      console.log('   2. You need to run the migration directly in Supabase SQL Editor');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Copy the migration file: supabase/migrations/20250116_enterprise_rbac_complete.sql');
      console.log('   2. Go to your Supabase dashboard');
      console.log('   3. Navigate to SQL Editor');
      console.log('   4. Paste and run the migration');
    } else {
      console.log('');
      console.log('✅ Migration completed successfully!');
    }

    // Verify the migration
    console.log('');
    console.log('🔍 Verifying migration...');

    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('name, level')
      .limit(5);

    if (roles && !rolesError) {
      console.log(`✅ Roles table exists with ${roles.length} roles`);
      console.log('   Sample roles:', roles.map(r => r.name).join(', '));
    } else {
      console.log('❌ Could not verify roles table:', rolesError?.message);
    }

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (!userRolesError) {
      console.log('✅ User roles table exists');
    } else {
      console.log('❌ Could not verify user_roles table:', userRolesError?.message);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();