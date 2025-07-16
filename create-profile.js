const { createClient } = require('@supabase/supabase-js');

// Create user profile
async function createProfile() {
  console.log('Creating profile for pedro@blipee.com...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896',
        email: 'pedro@blipee.com',
        display_name: 'Pedro',
        role: 'account_owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating profile:', error);
    } else {
      console.log('Profile created successfully!', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

createProfile();