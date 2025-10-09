/**
 * Remove all estimated/mock data from PLMJ organization
 * Only keep data that is real and verifiable
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeEstimatedData() {
  console.log('🧹 Removing estimated/mock data from PLMJ organization...\n');

  // Get current data
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  console.log('📊 Current Data:');
  console.log(`   value_added: ${org.value_added ? '€' + (org.value_added / 1000000).toFixed(1) + 'M (ESTIMATED - REMOVING)' : 'Not set'}`);
  console.log(`   annual_operating_hours: ${org.annual_operating_hours ? org.annual_operating_hours.toLocaleString() + ' (ESTIMATED - REMOVING)' : 'Not set'}`);
  console.log(`   annual_customers: ${org.annual_customers || 'Not set'} (ESTIMATED - REMOVING)\n`);

  // Remove estimated values - set to null
  const { data: updated, error } = await supabase
    .from('organizations')
    .update({
      value_added: null,
      annual_operating_hours: null,
      annual_customers: null
    })
    .eq('name', 'PLMJ')
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Successfully removed estimated data from PLMJ\n');
  console.log('📊 Remaining Data (REAL only):');
  console.log(`   ✅ industry_sector: ${updated.industry_sector || 'Not set'}`);
  console.log(`   ✅ sector_category: ${updated.sector_category || 'Not set'}`);
  console.log(`   ✅ annual_production_volume: ${updated.annual_production_volume || 'Not set'} (from sites aggregation)`);
  console.log(`   ✅ production_unit: ${updated.production_unit || 'Not set'}\n`);

  console.log('🔄 What will happen now:');
  console.log('   ✅ Per Employee: Will calculate (uses real employee data from sites)');
  console.log('   ✅ Per Area: Will calculate (uses real area data from sites)');
  console.log('   ✅ Sector-Specific: Will calculate (uses real FTE data)');
  console.log('   ❌ Per Revenue: Will NOT show (no revenue data - ESRS E1)');
  console.log('   ❌ Per Value Added: Will NOT show (no value added data - SBTi GEVA)');
  console.log('   ✅ Per Operating Hour: Will calculate using 40h/week × FTE (with tooltip showing calculation)');
  console.log('   ❌ Per Customer: Will NOT show (no customer data)\n');

  console.log('💡 To enable missing metrics, add REAL data:');
  console.log('   - annual_revenue: Get from PLMJ financial statements');
  console.log('   - value_added: Get from PLMJ financial statements (Revenue - Purchased Goods/Services)');
  console.log('   - annual_customers: Get from PLMJ client management system');
  console.log('   - annual_operating_hours: Get from PLMJ time tracking system (or leave blank to auto-calculate)');
}

removeEstimatedData().catch(console.error);
