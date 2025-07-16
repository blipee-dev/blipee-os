const { createClient } = require('@supabase/supabase-js');

// Insert pedro's profile
async function insertPedro() {
  console.log('Inserting profile for pedro@blipee.com...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Insert profile without role column
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896',
        email: 'pedro@blipee.com',
        full_name: 'Pedro',
        display_name: 'Pedro'
      })
      .select();
      
    if (error) {
      console.error('Error inserting profile:', error);
    } else {
      console.log('Profile created successfully!', data);
    }
    
    // Now test authentication again
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: 'pedro@blipee.com',
      password: '350098Pb'
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
    } else {
      console.log('Sign in successful!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

insertPedro();