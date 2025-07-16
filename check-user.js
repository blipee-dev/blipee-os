const { createClient } = require('@supabase/supabase-js');

// Check if user exists
async function checkUser() {
  console.log('Checking user in database...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check auth.users table using service role key to access auth schema
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth.users:', authError);
    } else {
      const pedro = authUsers?.users?.find(u => u.email === 'pedro@blipee.com');
      if (pedro) {
        console.log('User pedro@blipee.com found:', {
          id: pedro.id,
          email: pedro.email,
          created_at: pedro.created_at
        });
      } else {
        console.log('User pedro@blipee.com NOT found in auth.users');
        console.log('Total users in database:', authUsers?.users?.length || 0);
      }
    }
    
    // Check user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'pedro@blipee.com');
      
    // Also check profiles table
    const { data: profilesAlt, error: profileErrorAlt } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'pedro@blipee.com');
    
    if (profileError) {
      console.error('Error checking user_profiles:', profileError);
    } else {
      console.log('User profiles found:', profiles);
    }
    
    if (profileErrorAlt) {
      console.error('Error checking profiles table:', profileErrorAlt);
    } else {
      console.log('Profiles table found:', profilesAlt);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

checkUser();