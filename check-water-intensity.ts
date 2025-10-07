import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWaterIntensity() {
  console.log('🔍 Checking water intensity calculation...\n');

  // Get organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  const organizationId = orgs![0].id;
  console.log(`Organization: ${orgs![0].name} (${organizationId})\n`);

  // Get sites and employee count
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_employees')
    .eq('organization_id', organizationId);

  const totalEmployees = sites?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0;
  console.log('📊 Sites:');
  sites?.forEach(site => {
    console.log(`  ${site.name}: ${site.total_employees || 0} employees`);
  });
  console.log(`  Total Employees: ${totalEmployees}\n`);

  // Get water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  const metricIds = waterMetrics?.map(m => m.id) || [];

  // Get water data
  const { data: waterData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .limit(10000);

  console.log(`📊 Total water records: ${waterData?.length || 0}\n`);

  // Calculate totals
  let totalWithdrawal = 0;
  let totalDischarge = 0;

  (waterData || []).forEach((record: any) => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';
    const value = parseFloat(record.value) || 0;
    const isDischarge = metricCode.includes('wastewater');

    if (isDischarge) {
      totalDischarge += value;
    } else {
      totalWithdrawal += value;
    }
  });

  const totalConsumption = totalWithdrawal - totalDischarge;

  console.log('💧 Water Totals:');
  console.log(`  Total Withdrawal: ${totalWithdrawal.toFixed(2)} m³ (${(totalWithdrawal / 1000).toFixed(3)} ML)`);
  console.log(`  Total Discharge: ${totalDischarge.toFixed(2)} m³ (${(totalDischarge / 1000).toFixed(3)} ML)`);
  console.log(`  Total Consumption: ${totalConsumption.toFixed(2)} m³ (${(totalConsumption / 1000).toFixed(3)} ML)\n`);

  // Calculate intensity
  const waterIntensity = totalEmployees > 0 ? totalConsumption / totalEmployees : 0;

  console.log('📈 Water Intensity Calculation:');
  console.log(`  Formula: Total Consumption / Total Employees`);
  console.log(`  Calculation: ${totalConsumption.toFixed(2)} m³ / ${totalEmployees} employees`);
  console.log(`  Result: ${waterIntensity.toFixed(4)} m³ per employee\n`);

  console.log('✅ Expected display: ' + waterIntensity.toFixed(2) + ' m³ per employee');
}

checkWaterIntensity();
