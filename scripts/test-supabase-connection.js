const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

async function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===\n');

  // Test 1: Basic connection with anon key
  console.log('1. Testing basic connection with anon key...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Try to query a simple table
    const { data, error } = await supabaseAnon
      .from('organizations')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error querying with anon key:', error);
    } else {
      console.log('✅ Successfully connected with anon key');
    }
  } catch (e) {
    console.log('❌ Exception with anon key:', e.message);
  }

  // Test 2: Test auth schema access
  console.log('\n2. Testing auth schema access...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Try to query auth.users table with service key
    const { data: authData, error: authError } = await supabaseService
      .from('auth.users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (authError) {
      console.log('❌ Error accessing auth.users:', authError);
    } else {
      console.log('✅ Successfully accessed auth.users table');
    }
  } catch (e) {
    console.log('❌ Exception accessing auth.users:', e.message);
  }

  // Test 3: Check if auth functions are accessible
  console.log('\n3. Testing auth functions...');
  try {
    // Try to get auth settings
    const { data: settings, error: settingsError } = await supabaseService.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (settingsError) {
      console.log('❌ Error accessing auth admin functions:', settingsError);
    } else {
      console.log('✅ Auth admin functions accessible');
    }
  } catch (e) {
    console.log('❌ Exception with auth admin functions:', e.message);
  }

  // Test 4: Test signup function directly
  console.log('\n4. Testing signup function...');
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
    });
    
    if (signupError) {
      console.log('❌ Signup error:', signupError);
      console.log('Error details:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Signup successful:', signupData.user?.email);
      // Clean up test user
      if (signupData.user?.id) {
        await supabaseService.auth.admin.deleteUser(signupData.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }
  } catch (e) {
    console.log('❌ Signup exception:', e.message);
  }

  // Test 5: Check database schema
  console.log('\n5. Checking database tables...');
  try {
    const { data: tables, error: tablesError } = await supabaseService
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .in('table_schema', ['public', 'auth'])
      .order('table_schema', { ascending: true })
      .order('table_name', { ascending: true });
    
    if (tablesError) {
      console.log('❌ Error listing tables:', tablesError);
    } else {
      console.log('✅ Database tables found:');
      const publicTables = tables.filter(t => t.table_schema === 'public');
      const authTables = tables.filter(t => t.table_schema === 'auth');
      console.log(`   - Public schema: ${publicTables.length} tables`);
      console.log(`   - Auth schema: ${authTables.length} tables`);
    }
  } catch (e) {
    console.log('❌ Exception listing tables:', e.message);
  }
}

testSupabaseConnection().catch(console.error);