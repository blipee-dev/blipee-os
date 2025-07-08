const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS
const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyFix() {
  console.log('Applying auth fix...');
  
  // Read the SQL fix
  const fs = require('fs');
  const sql = fs.readFileSync(__dirname + '/fix-auth-signup-error.sql', 'utf8');
  
  // Since we can't run raw SQL through the JS client, let's test the auth directly
  console.log('Testing current auth state...');
  
  const testEmail = `test${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'testpassword123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User'
    }
  });
  
  if (error) {
    console.error('Admin create user failed:', error);
    console.log('\nThe issue needs to be fixed in the Supabase SQL Editor.');
    console.log('Please go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('And run the SQL from: scripts/fix-auth-signup-error.sql');
  } else {
    console.log('Admin user creation succeeded!');
    console.log('User ID:', data.user?.id);
    
    // Clean up test user
    if (data.user?.id) {
      await supabase.auth.admin.deleteUser(data.user.id);
      console.log('Test user cleaned up');
    }
  }
}

applyFix().catch(console.error);