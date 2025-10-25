import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check2025Emissions() {
  console.log('🔍 Checking 2025 Emissions Data...\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get all 2025 emissions data
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, metric_id, metrics_catalog!inner(scope, name, category)')
    .eq('organization_id', orgId)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  if (!allData || allData.length === 0) {
    console.log('❌ No emissions data found for 2025');
    return;
  }

  console.log(`📊 Total records: ${allData.length}\n`);

  // Split into actual (Jan-Oct) and forecast (Nov-Dec)
  const actualData = allData.filter(r => {
    const date = new Date(r.period_start);
    return date.getMonth() < 10; // 0-9 = Jan-Oct
  });

  const forecastData = allData.filter(r => {
    const date = new Date(r.period_start);
    return date.getMonth() >= 10; // 10-11 = Nov-Dec
  });

  // Calculate actual emissions (Jan-Oct)
  const actualEmissions = actualData.reduce((sum, r) => sum + (parseFloat(r.co2e_emissions) || 0), 0) / 1000; // Convert kgCO2e to tCO2e

  // Calculate forecast emissions (Nov-Dec)
  const forecastEmissions = forecastData.reduce((sum, r) => sum + (parseFloat(r.co2e_emissions) || 0), 0) / 1000;

  // Calculate projected annual
  const projectedAnnual = actualEmissions + forecastEmissions;

  console.log('📅 Jan-Oct 2025 (Actual):');
  console.log(`   Records: ${actualData.length}`);
  console.log(`   Total Emissions: ${actualEmissions.toFixed(1)} tCO2e\n`);

  console.log('📅 Nov-Dec 2025 (Forecast):');
  console.log(`   Records: ${forecastData.length}`);
  console.log(`   Total Emissions: ${forecastEmissions.toFixed(1)} tCO2e\n`);

  console.log('📊 Summary:');
  console.log(`   Actual (Jan-Oct): ${actualEmissions.toFixed(1)} tCO2e`);
  console.log(`   Forecast (Nov-Dec): ${forecastEmissions.toFixed(1)} tCO2e`);
  console.log(`   Projected Annual: ${projectedAnnual.toFixed(1)} tCO2e\n`);

  // Break down by scope
  console.log('📊 Breakdown by Scope (Jan-Oct Actual):');
  const byScope: any = { scope_1: 0, scope_2: 0, scope_3: 0 };

  actualData.forEach((r: any) => {
    const scope = r.metrics_catalog.scope;
    if (scope && byScope[scope] !== undefined) {
      byScope[scope] += (parseFloat(r.co2e_emissions) || 0) / 1000;
    }
  });

  console.log(`   Scope 1: ${byScope.scope_1.toFixed(1)} tCO2e`);
  console.log(`   Scope 2: ${byScope.scope_2.toFixed(1)} tCO2e`);
  console.log(`   Scope 3: ${byScope.scope_3.toFixed(1)} tCO2e`);
  console.log(`   Total: ${(byScope.scope_1 + byScope.scope_2 + byScope.scope_3).toFixed(1)} tCO2e\n`);

  // Check if the dashboard value matches
  console.log('✅ Expected Dashboard Values:');
  console.log(`   YTD Emissions: ${actualEmissions.toFixed(1)} tCO2e`);
  console.log(`   Projected Annual: ${projectedAnnual.toFixed(1)} tCO2e`);
  console.log(`   SBTi Progress: ${actualEmissions.toFixed(1)} + ${forecastEmissions.toFixed(1)} tCO2e`);
}

check2025Emissions();
