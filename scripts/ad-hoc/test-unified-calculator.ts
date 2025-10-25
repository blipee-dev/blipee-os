import { config } from 'dotenv';
config({ path: '.env.local' });

import { UnifiedSustainabilityCalculator } from './src/lib/sustainability/unified-calculator';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function testUnifiedCalculator() {
  console.log('🧪 Testing UnifiedSustainabilityCalculator Integration\n');
  console.log('='.repeat(80));

  const calculator = new UnifiedSustainabilityCalculator(organizationId);

  // Test 1: Get sustainability target
  console.log('\n📋 Test 1: Get Sustainability Target');
  console.log('─'.repeat(80));
  const target = await calculator.getSustainabilityTarget();
  if (target) {
    console.log(`✅ Target found:`);
    console.log(`   Baseline Year: ${target.baseline_year}`);
    console.log(`   Target Year: ${target.target_year}`);
    console.log(`   Emission Reduction: ${target.emissions_reduction_percent}%`);
    console.log(`   Energy Reduction: ${target.energy_reduction_percent}%`);
    console.log(`   Water Reduction: ${target.water_reduction_percent}%`);
    console.log(`   Waste Reduction: ${target.waste_reduction_percent}%`);
  } else {
    console.log('❌ No target found');
    return;
  }

  // Test 2: Get baseline emissions
  console.log('\n📊 Test 2: Get Baseline Emissions');
  console.log('─'.repeat(80));
  const baseline = await calculator.getBaseline('emissions');
  if (baseline) {
    console.log(`✅ Baseline (${baseline.year}): ${baseline.value} ${baseline.unit}`);
  } else {
    console.log('❌ No baseline data');
  }

  // Test 3: Get target emissions for current year
  console.log('\n🎯 Test 3: Get Target Emissions (Current Year)');
  console.log('─'.repeat(80));
  const targetEmissions = await calculator.getTarget('emissions');
  if (targetEmissions) {
    console.log(`✅ Target (${targetEmissions.year}): ${targetEmissions.value} ${targetEmissions.unit}`);
    console.log(`   Reduction Rate: ${targetEmissions.reductionPercent}% per year`);
    console.log(`   Formula: ${targetEmissions.formula}`);
  } else {
    console.log('❌ No target calculation');
  }

  // Test 4: Get projected emissions
  console.log('\n🔮 Test 4: Get Projected Emissions (2025)');
  console.log('─'.repeat(80));
  const projected = await calculator.getProjected('emissions');
  if (projected) {
    console.log(`✅ Projected (${projected.year}): ${projected.value} ${projected.unit}`);
    console.log(`   YTD Actual: ${projected.ytd} ${projected.unit}`);
    console.log(`   Forecast: ${projected.forecast} ${projected.unit}`);
    console.log(`   Method: ${projected.method}`);
  } else {
    console.log('❌ No projection available');
  }

  // Test 5: Calculate progress
  console.log('\n📈 Test 5: Calculate Progress to Target');
  console.log('─'.repeat(80));
  const progress = await calculator.calculateProgressToTarget('emissions');
  if (progress) {
    console.log(`✅ Progress Calculation:`);
    console.log(`   Baseline: ${progress.baseline} tCO2e`);
    console.log(`   Target: ${progress.target} tCO2e`);
    console.log(`   Projected: ${progress.projected} tCO2e`);
    console.log(`   Progress: ${progress.progressPercent.toFixed(1)}%`);
    console.log(`   Status: ${progress.status}`);
    console.log(`   Reduction Needed: ${progress.reductionNeeded.toFixed(1)} tCO2e`);
    console.log(`   Reduction Achieved: ${progress.reductionAchieved.toFixed(1)} tCO2e`);

    if (progress.exceedancePercent > 0) {
      console.log(`   ⚠️  Exceedance: ${progress.exceedancePercent.toFixed(1)}% over target`);
    }
  } else {
    console.log('❌ No progress data');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ UnifiedSustainabilityCalculator Test Complete');
  console.log('='.repeat(80));
}

testUnifiedCalculator().catch(console.error);
