const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrganizationsColumns() {
  console.log('🔍 Checking organizations table structure...\n');

  try {
    // Get a sample row to see the structure
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ organizations table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
      
      console.log('\nLooking for user-related columns:');
      const userColumns = columns.filter(col => 
        col.includes('user') || 
        col.includes('created') || 
        col.includes('owner') ||
        col.includes('by')
      );
      
      if (userColumns.length > 0) {
        console.log('Found potential user-related columns:');
        userColumns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('No obvious user-related columns found');
      }
    } else {
      console.log('No data in organizations table, but table exists');
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

checkOrganizationsColumns().catch(console.error);