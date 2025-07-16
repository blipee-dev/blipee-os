const { createClient } = require('@supabase/supabase-js');

// Create profile for pedro using RPC or direct insert
async function fixProfile() {
  console.log('Fixing profile for pedro@blipee.com...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%profile%');
      
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Tables with "profile" in name:', tables);
    }
    
    // Try to call the RPC function to create organization with owner
    const { data: orgData, error: orgError } = await supabase.rpc(
      'create_organization_with_owner',
      {
        org_name: 'Blipee Test Org',
        org_slug: 'blipee-test-org',
        owner_id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896'
      }
    );
    
    if (orgError) {
      console.error('Error creating organization:', orgError);
      
      // If RPC fails, let's check what RPC functions exist
      const { data: functions, error: functionsError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .eq('routine_type', 'FUNCTION');
        
      if (functionsError) {
        console.error('Error checking functions:', functionsError);
      } else {
        console.log('Available RPC functions:', functions);
      }
    } else {
      console.log('Organization created successfully!', orgData);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });

fixProfile();