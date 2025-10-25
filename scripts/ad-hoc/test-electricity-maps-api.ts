/**
 * Test Electricity Maps API to see raw response
 */

import {
  getHistoricalPowerBreakdown,
  getHistoricalCarbonIntensity,
  convertToEnergyMix
} from './src/lib/external/electricity-maps';

async function testAPI() {
  console.log('🧪 Testing Electricity Maps API\n');

  // Test with October 2025 (should be historical data as today is 2025-10-18)
  const datetime = '2025-10-15T12:00:00Z';
  const zone = 'PT';

  console.log(`Zone: ${zone}`);
  console.log(`Datetime: ${datetime}\n`);

  // Test power breakdown
  console.log('📊 Fetching power breakdown...\n');
  const breakdown = await getHistoricalPowerBreakdown(zone, datetime);

  if (breakdown) {
    console.log('✅ Power Breakdown Response:');
    console.log(JSON.stringify(breakdown, null, 2));
    console.log('\n');

    // Test conversion
    console.log('🔄 Converting to energy mix format...\n');
    const energyMix = convertToEnergyMix(breakdown);
    console.log('Energy Mix:');
    console.log(JSON.stringify(energyMix, null, 2));
  } else {
    console.log('❌ No breakdown data returned\n');
  }

  // Test carbon intensity
  console.log('\n💨 Fetching carbon intensity...\n');
  const carbonData = await getHistoricalCarbonIntensity(zone, datetime);

  if (carbonData) {
    console.log('✅ Carbon Intensity Response:');
    console.log(JSON.stringify(carbonData, null, 2));
  } else {
    console.log('❌ No carbon data returned');
  }
}

testAPI().catch(console.error);
