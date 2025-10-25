const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function testWaterForecastCalculation() {
  console.log('🧪 Testing Water Forecast Calculation Logic\n');

  // Step 1: Get water metric targets
  const { data: waterTargets } = await supabase
    .from('metric_targets')
    .select(`
      id,
      baseline_value,
      baseline_emissions,
      target_value,
      target_emissions,
      metrics_catalog (
        name,
        category
      )
    `)
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metrics_catalog.category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  console.log(`📋 Found ${waterTargets.length} water metric targets\n`);

  // Step 2: Get monthly actuals (YTD)
  const targetIds = waterTargets.map(t => t.id);
  const { data: monthlyData } = await supabase
    .from('metric_targets_monthly')
    .select('*')
    .in('metric_target_id', targetIds)
    .eq('year', 2025)
    .order('month');

  console.log(`📊 Found ${monthlyData.length} monthly actuals for 2025\n`);

  // Step 3: Fetch water forecast
  const forecastRes = await fetch('http://localhost:3001/api/water/forecast?start_date=2025-01-01&end_date=2025-12-31');
  const forecastData = await forecastRes.json();

  console.log(`🔮 Forecast available: ${forecastData.forecast ? 'YES' : 'NO'}`);
  console.log(`   Forecast months: ${forecastData.forecast?.length || 0}`);
  console.log(`   Forecast model: ${forecastData.model || 'N/A'}\n`);

  // Step 4: Calculate projected values for each target
  for (const target of waterTargets) {
    const category = target.metrics_catalog.category;
    const monthlyActuals = monthlyData.filter(m => m.metric_target_id === target.id);

    // Calculate YTD
    const ytdValue = monthlyActuals.reduce((sum, m) => sum + (m.actual_value || 0), 0);
    const ytdEmissions = monthlyActuals.reduce((sum, m) => sum + (m.actual_emissions || 0), 0);

    // Calculate forecast remaining
    let forecastRemaining = 0;
    if (forecastData.forecast) {
      forecastRemaining = forecastData.forecast.reduce((sum, f) => {
        if (category === 'Water Consumption') {
          return sum + (f.consumption || 0);
        } else if (category === 'Water Withdrawal') {
          return sum + (f.withdrawal || 0);
        } else if (category === 'Water Discharge') {
          return sum + (f.discharge || 0);
        }
        return sum;
      }, 0);
    }

    const projectedValue = ytdValue + forecastRemaining;
    const projectedEmissions = ytdEmissions + forecastRemaining;

    // Calculate progress
    const reductionNeeded = (target.baseline_emissions || 0) - (target.target_emissions || 0);
    const reductionAchieved = (target.baseline_emissions || 0) - projectedEmissions;
    const progressPercent = reductionNeeded > 0 ? (reductionAchieved / reductionNeeded) * 100 : 0;

    console.log(`✅ ${target.metrics_catalog.name}`);
    console.log(`   Category: ${category}`);
    console.log(`   Baseline: ${(target.baseline_value / 1000).toFixed(2)} ML`);
    console.log(`   Target: ${(target.target_value / 1000).toFixed(2)} ML`);
    console.log(`   YTD Actual (Jan-Jul): ${(ytdValue / 1000).toFixed(2)} ML`);
    console.log(`   Forecast Remaining (Aug-Dec): ${(forecastRemaining / 1000).toFixed(2)} ML`);
    console.log(`   📈 PROJECTED Full Year: ${(projectedValue / 1000).toFixed(2)} ML`);
    console.log(`   Progress: ${progressPercent.toFixed(1)}%`);
    console.log(`   Status: ${progressPercent >= 100 ? '✅ On Track' : progressPercent >= 80 ? '⚠️ At Risk' : '❌ Off Track'}\n`);
  }

  console.log('✨ Test complete! The API will now use these projected values.\n');
}

testWaterForecastCalculation().catch(console.error);
