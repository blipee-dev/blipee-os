const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the calculator functions
async function testForecast() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  
  // Get actual emissions YTD (Jan-Jul 2025)
  const { data: ytdData } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, metrics_catalog!inner(scope)')
    .eq('organization_id', orgId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-07-31');

  let ytdTotal = 0;
  if (ytdData) {
    ytdData.forEach(r => {
      ytdTotal += (r.co2e_emissions || 0);
    });
  }

  console.log('\n📊 2025 Emissions Summary:');
  console.log('═══════════════════════════════════════');
  console.log('Actual YTD (Jan-Jul):', (ytdTotal / 1000).toFixed(1), 'tCO2e');
  console.log('Months with data: 7/12');
  
  // Based on the OverviewDashboard logs you showed:
  // Actual: 308.5 tCO2e, Forecasted: 636.4 tCO2e, Total: 944.9 tCO2e
  const actualYTD = 308.5;
  const forecastedRemaining = 636.4;
  const projectedTotal = 944.9;
  
  console.log('\n🔮 Forecast for Remaining 2025 (Aug-Dec):');
  console.log('═══════════════════════════════════════');
  console.log('Forecasted emissions:', forecastedRemaining.toFixed(1), 'tCO2e');
  console.log('Months to forecast: 5');
  console.log('Average per month:', (forecastedRemaining / 5).toFixed(1), 'tCO2e/month');
  
  console.log('\n📈 Full Year 2025 Projection:');
  console.log('═══════════════════════════════════════');
  console.log('Actual (Jan-Jul):', actualYTD.toFixed(1), 'tCO2e');
  console.log('Forecast (Aug-Dec):', forecastedRemaining.toFixed(1), 'tCO2e');
  console.log('Projected Total:', projectedTotal.toFixed(1), 'tCO2e');
  
  console.log('\n📊 Comparison with Historical Years:');
  console.log('═══════════════════════════════════════');
  
  const years = [2022, 2023, 2024];
  for (const year of years) {
    const { data } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', orgId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);
    
    let total = 0;
    if (data) {
      data.forEach(r => total += (r.co2e_emissions || 0));
    }
    
    const change = ((projectedTotal - (total/1000)) / (total/1000) * 100);
    console.log(`${year}: ${(total/1000).toFixed(1)} tCO2e (${change > 0 ? '+' : ''}${change.toFixed(1)}% vs 2025 projection)`);
  }
  
  console.log('\n');
}

testForecast();
