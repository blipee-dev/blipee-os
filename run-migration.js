const fs = require('fs');

// Read the migration file
const migrationSQL = fs.readFileSync('supabase/migrations/20251013_metric_recommendations.sql', 'utf8');

async function runMigration() {
  // For now, just output the SQL to verify it's correct
  // The user can run it manually via Supabase dashboard or their preferred tool
  console.log('📋 Migration SQL ready to execute:');
  console.log('=====================================\n');
  console.log('The migration has been fixed to use "organization_members" table.');
  console.log('\nTo apply this migration, please:');
  console.log('1. Go to your Supabase Dashboard -> SQL Editor');
  console.log('2. Copy and paste the contents of: supabase/migrations/20251013_metric_recommendations.sql');
  console.log('3. Execute the migration');
  console.log('\nOR use the Supabase CLI:');
  console.log('   supabase db push\n');
  console.log('=====================================\n');

  // Verify the fix was applied
  const hasCorrectTable = migrationSQL.includes('organization_members');
  const hasWrongTable = migrationSQL.includes('user_organizations');

  console.log('✅ Verification:');
  console.log(`   - Uses "organization_members": ${hasCorrectTable ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Contains "user_organizations": ${hasWrongTable ? '❌ YES (ERROR!)' : '✅ NO (GOOD!)'}`);

  if (hasCorrectTable && !hasWrongTable) {
    console.log('\n✅ Migration file is ready to apply!');
  } else {
    console.log('\n❌ Migration file still has issues!');
    process.exit(1);
  }
}

runMigration().catch(console.error);
