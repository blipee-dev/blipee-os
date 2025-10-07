const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== TESTING INTENSITY CALCULATIONS ===\n');

  // Get organization data
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', plmjOrgId)
    .single();

  console.log('Organization:', org.name);
  console.log('  Metadata:', org.metadata);

  // Get sites data
  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', plmjOrgId);

  const totalEmployees = sites.reduce((sum, s) => sum + (s.total_employees || 0), 0);
  const totalAreaSqm = sites.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0);

  console.log('  Total employees (from sites):', totalEmployees);
  console.log('  Total area (from sites):', totalAreaSqm, 'sqm');
  console.log('  Annual revenue (from metadata):', org.metadata?.annual_revenue);

  // Get total energy consumption
  const { data: metrics } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = metrics.map(m => m.id);

  const { data: energyData } = await supabaseAdmin
    .from('metrics_data')
    .select('value, unit')
    .eq('organization_id', plmjOrgId)
    .in('metric_id', metricIds);

  const totalConsumptionKwh = energyData.reduce((sum, d) => sum + (d.value || 0), 0);

  console.log('\nTotal consumption:', totalConsumptionKwh.toFixed(0), 'kWh\n');

  // Calculate intensities using sites data
  const perEmployee = totalEmployees > 0
    ? totalConsumptionKwh / totalEmployees
    : 0;

  const perSquareMeter = totalAreaSqm > 0
    ? totalConsumptionKwh / totalAreaSqm
    : 0;

  const annualRevenue = org.metadata?.annual_revenue || 0;
  const perRevenue = annualRevenue > 0
    ? (totalConsumptionKwh / 1000) / (annualRevenue / 1000000)
    : 0;

  console.log('Intensity Metrics:');
  console.log('  Per Employee:', perEmployee.toFixed(1), 'kWh/FTE');
  console.log('  Per Square Meter:', perSquareMeter.toFixed(2), 'kWh/m²');
  console.log('  Per Revenue:', perRevenue.toFixed(2), 'MWh/$M');
})();
