const { createClient } = require('@supabase/supabase-js');

// Check table schema
async function checkSchema() {
  console.log('Checking table schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to select from user_profiles to see what columns exist
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error querying user_profiles:', error);
    } else {
      console.log('user_profiles columns:', data);
    }
    
    // Also check organization_members
    const { data: orgData, error: orgError } = await supabase
      .from('organization_members')
      .select('*')
      .limit(1);
      
    if (orgError) {
      console.error('Error querying organization_members:', orgError);
    } else {
      console.log('organization_members columns:', orgData);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

checkSchema();