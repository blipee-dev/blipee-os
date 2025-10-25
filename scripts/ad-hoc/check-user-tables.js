const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkTables() {
  console.log('Checking database schema...\n');

  // Check organizations table
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (!orgError) {
    console.log('✓ organizations table exists');
    if (org.length > 0) {
      console.log('  Sample columns:', Object.keys(org[0]).join(', '));
    }
  } else {
    console.log('✗ organizations error:', orgError.message);
  }

  // Check for user-organization relationship table
  const possibleNames = [
    'user_organizations',
    'organization_users',
    'organization_members',
    'team_members',
    'user_roles'
  ];

  console.log('\nChecking user-organization relationship tables:');
  for (const tableName of possibleNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`✓ ${tableName} exists`);
      if (data.length > 0) {
        console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  // Check sites table
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .limit(1);

  if (!sitesError) {
    console.log('\n✓ sites table exists');
  } else {
    console.log('\n✗ sites error:', sitesError.message);
  }

  // Check auth.users reference
  console.log('\n📝 Note: RLS policies need to reference the correct user-organization table');
  console.log('   Common patterns:');
  console.log('   - organization_users (user_id, organization_id, role)');
  console.log('   - team_members (user_id, organization_id, role)');
}

checkTables().catch(console.error);
