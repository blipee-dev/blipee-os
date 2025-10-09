/**
 * Verify intensity calculations are working correctly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { calculateSectorIntensity, getProductionUnitLabel } = require('../src/lib/sustainability/sector-intensity.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('🔍 Verifying Intensity Calculations for PLMJ\n');

  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  console.log('📊 Organization Data:');
  console.log(`   Sector: ${org.industry_sector}`);
  console.log(`   Production Volume: ${org.annual_production_volume} ${org.production_unit}`);
  console.log(`   Value Added: €${(org.value_added / 1000000).toFixed(1)}M`);

  // Get sites and employees
  const { data: sites } = await supabase
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', org.id);

  const totalEmployees = sites?.reduce((sum, s) => sum + (s.total_employees || 0), 0) || 0;
  const totalArea = sites?.reduce((sum, s) => sum + (parseFloat(s.total_area_sqm) || 0), 0) || 0;

  console.log(`   Employees (from sites): ${totalEmployees}`);
  console.log(`   Total Area: ${totalArea.toLocaleString()} m²\n`);

  // Get 2025 emissions
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, metrics_catalog!inner(scope)')
    .eq('organization_id', org.id)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31');

  const scope1 = metrics?.filter(m => m.metrics_catalog.scope === 'scope_1')
    .reduce((sum, m) => sum + (parseFloat(m.co2e_emissions) || 0), 0) / 1000 || 0;

  const scope2 = metrics?.filter(m => m.metrics_catalog.scope === 'scope_2')
    .reduce((sum, m) => sum + (parseFloat(m.co2e_emissions) || 0), 0) / 1000 || 0;

  const scope3 = metrics?.filter(m => m.metrics_catalog.scope === 'scope_3')
    .reduce((sum, m) => sum + (parseFloat(m.co2e_emissions) || 0), 0) / 1000 || 0;

  const totalEmissions = scope1 + scope2 + scope3;

  console.log('💨 Emissions (2025):');
  console.log(`   Scope 1: ${scope1.toFixed(2)} tCO2e`);
  console.log(`   Scope 2: ${scope2.toFixed(2)} tCO2e`);
  console.log(`   Scope 3: ${scope3.toFixed(2)} tCO2e`);
  console.log(`   Total: ${totalEmissions.toFixed(2)} tCO2e\n`);

  console.log('📐 Calculated Intensity Metrics:\n');

  // Per Employee
  if (totalEmployees > 0) {
    const perEmployee = totalEmissions / totalEmployees;
    console.log(`✅ Per Employee: ${perEmployee.toFixed(3)} tCO2e/FTE`);
  }

  // Per Revenue (if available)
  if (org.annual_revenue > 0) {
    const perRevenue = (totalEmissions * 1000000) / org.annual_revenue;
    console.log(`✅ Per Revenue: ${perRevenue.toFixed(3)} tCO2e/M€ (ESRS E1 Mandatory)`);
  }

  // Per Area
  if (totalArea > 0) {
    const perSqm = (totalEmissions * 1000) / totalArea;
    console.log(`✅ Per m²: ${perSqm.toFixed(3)} kgCO2e/m²`);
  }

  // Per Value Added (GEVA)
  if (org.value_added > 0) {
    const perValueAdded = (totalEmissions * 1000000) / org.value_added;
    console.log(`✅ Per Value Added: ${perValueAdded.toFixed(3)} tCO2e/M€ VA (SBTi GEVA)`);
  }

  // Sector-Specific
  if (org.annual_production_volume > 0 && org.production_unit) {
    const sectorResult = calculateSectorIntensity(
      totalEmissions,
      org.annual_production_volume,
      org.production_unit,
      org.industry_sector
    );

    console.log(`\n🎯 Sector-Specific (${org.industry_sector}):`);
    console.log(`   Intensity: ${sectorResult.intensity.toFixed(3)} ${sectorResult.unit}`);
    console.log(`   Benchmark: ${sectorResult.benchmark || 'N/A'}`);
    console.log(`   Industry Average: ${sectorResult.benchmarkValue?.toFixed(3) || 'N/A'} ${sectorResult.unit}`);
  }

  // Per Operating Hour
  if (org.annual_operating_hours > 0) {
    const perHour = (totalEmissions * 1000) / org.annual_operating_hours;
    console.log(`\n✅ Per Operating Hour: ${perHour.toFixed(3)} kgCO2e/h`);
  }

  // Per Customer
  if (org.annual_customers > 0) {
    const perCustomer = (totalEmissions * 1000) / org.annual_customers;
    console.log(`✅ Per Customer: ${perCustomer.toFixed(2)} kgCO2e`);
  }

  console.log('\n🎉 All intensity metrics calculated successfully!');
  console.log('\n💡 These should match what appears in the dashboard.');
}

verify().catch(console.error);
