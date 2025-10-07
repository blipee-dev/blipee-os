/**
 * Test Electricity Maps API Integration
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  getLatestPowerBreakdown,
  convertToEnergyMix
} from './src/lib/external/electricity-maps';

async function testElectricityMaps() {
  console.log('🔌 Testing Electricity Maps API for Portugal...\n');

  // Get latest data for Portugal
  const breakdown = await getLatestPowerBreakdown('PT');

  if (!breakdown) {
    console.error('❌ Failed to fetch data');
    return;
  }

  console.log('📊 Raw Power Breakdown:');
  console.log(`  Zone: ${breakdown.zone}`);
  console.log(`  Datetime: ${breakdown.datetime}`);
  console.log(`  Updated At: ${breakdown.updatedAt}`);
  console.log(`  Total Consumption: ${breakdown.powerConsumptionTotal} kW`);
  console.log(`  Renewable %: ${breakdown.renewablePercentage}%`);
  console.log(`  Fossil Free %: ${breakdown.fossilFreePercentage}%`);
  console.log('\n  Power Sources:');
  Object.entries(breakdown.powerConsumptionBreakdown).forEach(([source, value]) => {
    if (value !== null && value > 0) {
      const percentage = ((value / (breakdown.powerConsumptionTotal || 1)) * 100).toFixed(2);
      console.log(`    - ${source}: ${value} kW (${percentage}%)`);
    }
  });

  // Convert to our format
  console.log('\n\n🔄 Converted Energy Mix:');
  const energyMix = convertToEnergyMix(breakdown);
  console.log(`  Renewable: ${energyMix.renewable_percentage}%`);
  console.log(`  Non-Renewable: ${energyMix.non_renewable_percentage}%`);
  console.log('\n  Sources Breakdown:');
  energyMix.sources.forEach(source => {
    const icon = source.renewable ? '🌱' : '⚫';
    console.log(`    ${icon} ${source.name}: ${source.percentage}%`);
  });

  console.log('\n\n✅ Test complete!');
  console.log('\nThis data would be stored in metrics_data.metadata as:');
  console.log(JSON.stringify({
    grid_mix: {
      provider: 'Electricity Maps',
      zone: breakdown.zone,
      datetime: breakdown.datetime,
      renewable_percentage: energyMix.renewable_percentage,
      non_renewable_percentage: energyMix.non_renewable_percentage,
      sources: energyMix.sources,
      source: 'electricity_maps_api'
    }
  }, null, 2));
}

testElectricityMaps();
