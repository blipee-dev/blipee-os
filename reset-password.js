const { createClient } = require('@supabase/supabase-js');

// Reset user password
async function resetPassword() {
  console.log('Resetting password for pedro@blipee.com...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      'd5708d9c-34fb-4c85-90ec-34faad9e2896',
      { password: '350098Pb' }
    );
    
    if (error) {
      console.error('Error resetting password:', error);
    } else {
      console.log('Password reset successful!');
      
      // Now try to sign in with the new password
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
        email: 'pedro@blipee.com',
        password: '350098Pb'
      });
      
      if (signInError) {
        console.error('Sign in error after reset:', signInError);
      } else {
        console.log('Sign in successful after reset!');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

resetPassword();