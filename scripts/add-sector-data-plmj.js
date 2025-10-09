/**
 * Add sector-specific data to PLMJ organization
 * This enables sector-specific intensity metrics display
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSectorData() {
  console.log('🔧 Adding sector-specific data to PLMJ organization...\n');

  // Get PLMJ organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  if (orgError || !org) {
    console.error('❌ Error finding PLMJ organization:', orgError);
    return;
  }

  console.log('📊 Current PLMJ data:');
  console.log(`   ID: ${org.id}`);
  console.log(`   Name: ${org.name}`);
  console.log(`   Available columns:`, Object.keys(org).join(', '));
  console.log(`\n`);

  // Get total employees from sites
  const { data: sites } = await supabase
    .from('sites')
    .select('total_employees')
    .eq('organization_id', org.id);

  const totalEmployees = sites?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 200;

  console.log(`   Total Employees (from sites): ${totalEmployees}`);
  console.log(`   Current Sector: ${org.industry_sector || 'Not set'}\n`);

  // Update with sector-specific data
  // PLMJ is a law firm = Professional Services sector
  const sectorData = {
    industry_sector: 'Professional Services',
    sector_category: 'services',
    annual_production_volume: totalEmployees, // Use employee count as "production" for services
    production_unit: 'FTE',
    value_added: 12000000, // Estimate €12M value added for law firm
    annual_operating_hours: totalEmployees * 2000, // Estimate 2000 hours/employee/year
    annual_customers: 150 // Estimate number of clients
  };

  const { data: updated, error: updateError } = await supabase
    .from('organizations')
    .update(sectorData)
    .eq('id', org.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating organization:', updateError);
    return;
  }

  console.log('✅ Successfully updated PLMJ with sector data:\n');
  console.log('   Industry Sector: Professional Services');
  console.log('   Sector Category: services');
  console.log(`   Production Volume: ${sectorData.annual_production_volume} FTE`);
  console.log(`   Production Unit: FTE (Full-Time Employees)`);
  console.log(`   Value Added: €${(sectorData.value_added / 1000000).toFixed(1)}M`);
  console.log(`   Operating Hours: ${sectorData.annual_operating_hours.toLocaleString()} hours/year`);
  console.log(`   Annual Customers: ${sectorData.annual_customers} clients`);

  console.log('\n🎯 Sector-specific intensity will now display:');
  console.log('   - tCO2e/FTE (primary production-based intensity)');
  console.log('   - Benchmark vs. Professional Services industry average');
  console.log('   - Performance indicator (Best in Class / Above Average / etc.)');
  console.log('   - SBTi GEVA economic intensity (tCO2e/M€ value added)');

  console.log('\n📈 To see it in action:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Navigate to: Sustainability → Emissions');
  console.log('   3. Scroll to the "Intensity Metrics" card');
  console.log('   4. You should see sector-specific intensity at the bottom!\n');
}

addSectorData().catch(console.error);
