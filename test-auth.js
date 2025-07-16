const { createClient } = require('@supabase/supabase-js');

// Test Supabase connection
async function testAuth() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Set' : 'Not set');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'pedro@blipee.com',
      password: '350098Pb'
    });
    
    if (error) {
      console.error('Auth error:', error);
    } else {
      console.log('Auth successful!', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

testAuth();