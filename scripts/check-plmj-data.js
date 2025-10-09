/**
 * Check PLMJ organization data to debug missing intensity metrics
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('🔍 Checking PLMJ Organization Data\n');

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Organization Fields:');
  console.log(`   ID: ${org.id}`);
  console.log(`   Name: ${org.name}`);
  console.log(`   Annual Revenue: ${org.annual_revenue || 'NOT SET'}`);
  console.log(`   Value Added: ${org.value_added || 'NOT SET'}`);
  console.log(`   Industry Sector: ${org.industry_sector || 'NOT SET'}`);
  console.log(`   Sector Category: ${org.sector_category || 'NOT SET'}`);
  console.log(`   Production Volume: ${org.annual_production_volume || 'NOT SET'}`);
  console.log(`   Production Unit: ${org.production_unit || 'NOT SET'}`);
  console.log(`   Operating Hours: ${org.annual_operating_hours || 'NOT SET'}`);
  console.log(`   Annual Customers: ${org.annual_customers || 'NOT SET'}`);
  console.log(`   Employee Count: ${org.employee_count || 'NOT SET'}`);
  console.log(`   Employees field: ${org.employees || 'NOT SET'}\n`);

  // Check sites for employee count
  const { data: sites } = await supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', org.id);

  const totalEmployees = sites?.reduce((sum, s) => sum + (s.total_employees || 0), 0) || 0;
  const totalArea = sites?.reduce((sum, s) => sum + (parseFloat(s.total_area_sqm) || 0), 0) || 0;

  console.log('🏢 Sites Data:');
  console.log(`   Total Employees (aggregated): ${totalEmployees}`);
  console.log(`   Total Area: ${totalArea.toLocaleString()} m²\n`);

  console.log('❓ Missing Data Analysis:');
  if (!org.annual_revenue) {
    console.log('   ⚠️  annual_revenue is missing → Per Revenue metric will be 0');
    console.log('      → ESRS E1 card will NOT display');
  }
  if (!org.value_added) {
    console.log('   ⚠️  value_added is missing → Per Value Added metric will be 0');
    console.log('      → SBTi GEVA card will NOT display');
  }
  if (!org.industry_sector || !org.annual_production_volume || !org.production_unit) {
    console.log('   ⚠️  Sector data incomplete → Sector-Specific card will NOT display');
    console.log(`      industry_sector: ${org.industry_sector || 'missing'}`);
    console.log(`      annual_production_volume: ${org.annual_production_volume || 'missing'}`);
    console.log(`      production_unit: ${org.production_unit || 'missing'}`);
  }
}

check().catch(console.error);
