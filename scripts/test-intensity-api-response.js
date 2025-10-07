const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== SIMULATING INTENSITY API RESPONSE ===\n');

  // Get organization
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('metadata')
    .eq('id', plmjOrgId)
    .single();

  // Get sites data
  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('total_employees, total_area_sqm')
    .eq('organization_id', plmjOrgId);

  // Get energy metrics
  const { data: energyMetrics } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = energyMetrics.map(m => m.id);

  // Get total energy consumption
  const { data: energyData } = await supabaseAdmin
    .from('metrics_data')
    .select('value')
    .eq('organization_id', plmjOrgId)
    .in('metric_id', metricIds);

  const totalConsumptionKwh = energyData.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

  // Aggregate from sites
  const totalEmployees = sites.reduce((sum, s) => sum + (s.total_employees || 0), 0);
  const totalAreaSqm = sites.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0);
  const annualRevenue = org?.metadata?.annual_revenue || 0;

  // Calculate intensity metrics
  const perEmployee = totalEmployees > 0 ? totalConsumptionKwh / totalEmployees : 0;
  const perSquareMeter = totalAreaSqm > 0 ? totalConsumptionKwh / totalAreaSqm : 0;
  const perRevenue = annualRevenue > 0 ? (totalConsumptionKwh / 1000) / (annualRevenue / 1000000) : 0;

  const response = {
    perEmployee: {
      value: Math.round(perEmployee * 10) / 10,
      unit: 'kWh/FTE',
      trend: 0
    },
    perSquareMeter: {
      value: Math.round(perSquareMeter * 10) / 10,
      unit: 'kWh/m²',
      trend: 0
    },
    perRevenue: {
      value: Math.round(perRevenue * 10) / 10,
      unit: 'MWh/$M',
      trend: 0
    },
    perProduction: {
      value: 0,
      unit: 'kWh/unit',
      trend: 0
    }
  };

  console.log('API Response:');
  console.log(JSON.stringify(response, null, 2));
})();
