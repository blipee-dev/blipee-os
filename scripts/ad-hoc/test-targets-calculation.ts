import { getPeriodEmissions } from './src/lib/sustainability/baseline-calculator';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testTargetsCalculation() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const currentYear = 2025;

  console.log('Testing Targets API calculation logic\n');
  console.log('='.repeat(60));

  // Step 1: Get YTD emissions using baseline calculator
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n📅 Fetching YTD emissions (2025-01-01 to ${today})`);

  const ytdEmissions = await getPeriodEmissions(
    organizationId,
    `${currentYear}-01-01`,
    today
  );

  console.log(`✅ YTD Emissions from getPeriodEmissions():`);
  console.log(`   Scope 1: ${ytdEmissions.scope_1.toFixed(2)} tCO2e`);
  console.log(`   Scope 2: ${ytdEmissions.scope_2.toFixed(2)} tCO2e`);
  console.log(`   Scope 3: ${ytdEmissions.scope_3.toFixed(2)} tCO2e`);
  console.log(`   Total: ${ytdEmissions.total.toFixed(2)} tCO2e`);

  // Step 2: Simulate what the forecast would add
  // Based on my earlier debug script, we have 7 months of data
  // The forecast would add 5 months
  const monthsCovered = 7;
  const remainingMonths = 12 - monthsCovered;
  const monthlyAverage = ytdEmissions.total / monthsCovered;
  const simpleForecas = monthlyAverage * remainingMonths;

  console.log(`\n📊 Simple Forecast (for illustration):`);
  console.log(`   Monthly average: ${monthlyAverage.toFixed(2)} tCO2e/month`);
  console.log(`   Remaining months: ${remainingMonths}`);
  console.log(`   Forecasted remaining: ${simpleForecas.toFixed(2)} tCO2e`);

  const projectedTotal = ytdEmissions.total + simpleForecas;
  console.log(`\n🎯 Projected 2025 Total:`);
  console.log(`   Actual YTD: ${ytdEmissions.total.toFixed(2)} tCO2e`);
  console.log(`   + Forecast: ${simpleForecas.toFixed(2)} tCO2e`);
  console.log(`   = Total: ${projectedTotal.toFixed(2)} tCO2e`);

  console.log('\n' + '='.repeat(60));

  // The user is seeing 592.231 - let's check if this matches
  if (Math.abs(projectedTotal - 592.231) < 1) {
    console.log('✅ This matches what the user is seeing (592.231)');
    console.log('   The values ARE in tCO2e (correctly converted)');
  } else {
    console.log(`❌ Discrepancy: Expected ${projectedTotal.toFixed(2)} but user sees 592.231`);
  }
}

testTargetsCalculation().catch(console.error);
