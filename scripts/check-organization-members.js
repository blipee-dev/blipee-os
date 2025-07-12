const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrganizationMembers() {
  console.log('🔍 Checking organization_members table structure...\n');

  try {
    // Get a sample row to see the structure
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ organization_members table structure:');
      console.log('Columns:', Object.keys(data[0]).join(', '));
      
      console.log('\nSample data:');
      data.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, {
          ...row,
          user_id: row.user_id ? '***' : null,  // Hide actual IDs for privacy
          organization_id: row.organization_id ? '***' : null
        });
      });

      // Check for role values
      const roles = [...new Set(data.map(d => d.role).filter(Boolean))];
      console.log('\nRoles found:', roles);
    } else {
      console.log('No data in organization_members table');
    }

    // Count total records
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nTotal records: ${count}`);

  } catch (e) {
    console.error('Error:', e);
  }
}

checkOrganizationMembers().catch(console.error);