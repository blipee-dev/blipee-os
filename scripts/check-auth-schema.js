const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

async function checkAuthSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('=== Checking Auth Schema Configuration ===\n');

  // Check if we can query system tables
  console.log('1. Checking system catalog access...');
  try {
    const { data: schemas, error: schemaError } = await supabase
      .rpc('pg_namespace')
      .select('*');
    
    if (schemaError) {
      console.log('Cannot access pg_namespace directly');
    }
  } catch (e) {
    console.log('System catalog not directly accessible');
  }

  // Check public tables
  console.log('\n2. Checking public schema tables...');
  const publicTables = [
    'organizations',
    'organization_users',
    'buildings',
    'conversations',
    'messages',
    'user_profiles'
  ];

  for (const table of publicTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message || 'Error'}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // Check if profiles table exists
  console.log('\n3. Checking profiles table (often linked to auth.users)...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ profiles table error:', error.message);
      if (error.code === '42P01') {
        console.log('   → profiles table does not exist');
      }
    } else {
      console.log('✅ profiles table exists');
    }
  } catch (e) {
    console.log('❌ profiles exception:', e.message);
  }

  // Check auth configuration using admin API
  console.log('\n4. Checking auth configuration...');
  try {
    // Try to get instance settings
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    if (response.ok) {
      const settings = await response.json();
      console.log('✅ Auth settings accessible');
      console.log('   - Email enabled:', settings.external?.email?.enabled !== false);
      console.log('   - Signup enabled:', settings.disable_signup !== true);
    } else {
      console.log('❌ Cannot fetch auth settings:', response.status);
    }
  } catch (e) {
    console.log('❌ Auth settings error:', e.message);
  }

  // Test raw SQL query
  console.log('\n5. Testing raw SQL access...');
  try {
    const { data, error } = await supabase.rpc('get_auth_error_test', {});
    if (error) {
      console.log('No custom RPC function available');
    }
  } catch (e) {
    console.log('RPC not available');
  }

  // Check if there's a trigger or constraint issue
  console.log('\n6. Attempting minimal signup to identify specific error...');
  try {
    const testEmail = `minimal-test-${Date.now()}@example.com`;
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test123456!',
        data: {}
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log('❌ Direct API signup failed:', response.status);
      console.log('   Error:', JSON.stringify(result, null, 2));
    } else {
      console.log('✅ Direct API signup succeeded');
      // Clean up
      if (result.user?.id) {
        await supabase.auth.admin.deleteUser(result.user.id);
      }
    }
  } catch (e) {
    console.log('❌ Direct API error:', e.message);
  }
}

checkAuthSchema().catch(console.error);