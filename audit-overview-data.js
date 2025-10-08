const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditOverviewData() {
  console.log('🔍 OVERVIEW DASHBOARD DATA AUDIT\n');
  console.log('='.repeat(80));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // 1. Get actual yearly emissions
  console.log('\n📊 STEP 1: Actual Yearly Emissions from Database\n');

  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', organizationId)
      .gte('period_start', '2022-01-01')
      .order('period_start', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const yearData = {};
  allData.forEach(record => {
    if (record.period_start) {
      const year = record.period_start.substring(0, 4);
      if (!yearData[year]) {
        yearData[year] = { emissions: 0, months: new Set() };
      }
      yearData[year].emissions += (record.co2e_emissions || 0);
      yearData[year].months.add(record.period_start.substring(0, 7));
    }
  });

  Object.keys(yearData).sort().forEach(year => {
    const tco2e = yearData[year].emissions / 1000;
    const monthCount = yearData[year].months.size;
    const status = monthCount === 12 ? '✅ Complete' : `⚠️  ${monthCount}/12 months`;
    console.log(`${year}: ${tco2e.toFixed(2)} tCO2e ${status}`);

    if (monthCount < 12) {
      const projected = (tco2e / monthCount) * 12;
      console.log(`       Projected annual: ${projected.toFixed(2)} tCO2e`);
    }
  });

  // 2. Get SBTi Target data
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 STEP 2: SBTi Target Record in Database\n');

  const { data: target, error: targetError } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (targetError) {
    console.error('❌ Error fetching target:', targetError);
  } else {
    console.log(`Target Name: ${target.target_name}`);
    console.log(`Baseline Year: ${target.baseline_year}`);
    console.log(`Baseline Value: ${target.baseline_value} ${target.baseline_unit}`);
    console.log(`Baseline Emissions: ${target.baseline_emissions} tCO2e`);
    console.log(`Target Year: ${target.target_year}`);
    console.log(`Target Value: ${target.target_value} ${target.target_unit}`);
    console.log(`Target Reduction %: ${target.target_reduction_percent}%`);
    console.log(`Calculated Target: ${target.target_emissions} tCO2e`);
    console.log(`Annual Reduction Rate: ${target.annual_reduction_rate}%/year`);
  }

  // 3. Calculate what the values SHOULD be
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ STEP 3: Correct Values (Based on Actual Data)\n');

  const baselineYear = 2023;
  const targetYear = 2030;
  const reductionPercent = 42;

  const actualBaseline = yearData[baselineYear].emissions / 1000;
  const correctTarget = actualBaseline * (1 - reductionPercent / 100);
  const yearsToTarget = targetYear - baselineYear;
  const annualRate = reductionPercent / yearsToTarget;

  console.log(`Baseline (${baselineYear}): ${actualBaseline.toFixed(2)} tCO2e`);
  console.log(`Target (${targetYear}): ${correctTarget.toFixed(2)} tCO2e`);
  console.log(`Reduction: ${reductionPercent}% (${(actualBaseline - correctTarget).toFixed(2)} tCO2e)`);
  console.log(`Annual reduction rate: ${annualRate.toFixed(2)}%/year`);

  // 4. Calculate current progress
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 STEP 4: Current Progress Analysis\n');

  const currentYear = new Date().getFullYear();
  const current2025 = yearData['2025'].emissions / 1000;
  const monthsCovered = yearData['2025'].months.size;
  const projected2025 = (current2025 / monthsCovered) * 12;

  console.log(`${currentYear} Actual (YTD): ${current2025.toFixed(2)} tCO2e (${monthsCovered} months)`);
  console.log(`${currentYear} Projected: ${projected2025.toFixed(2)} tCO2e`);

  const yearsElapsed = currentYear - baselineYear;
  const requiredReduction = (actualBaseline - correctTarget) * (yearsElapsed / yearsToTarget);
  const requiredEmissions = actualBaseline - requiredReduction;
  const actualReduction = actualBaseline - projected2025;
  const progressRatio = actualReduction / requiredReduction;

  console.log(`\nLinear trajectory:`);
  console.log(`  Required emissions by ${currentYear}: ${requiredEmissions.toFixed(2)} tCO2e`);
  console.log(`  Projected emissions for ${currentYear}: ${projected2025.toFixed(2)} tCO2e`);
  console.log(`  Gap: ${(projected2025 - requiredEmissions).toFixed(2)} tCO2e (${((projected2025 - requiredEmissions) / requiredEmissions * 100).toFixed(1)}% over target)`);

  let status;
  if (progressRatio >= 1.05) status = 'Exceeding';
  else if (progressRatio >= 0.95) status = 'On Track';
  else if (progressRatio >= 0.85) status = 'At Risk';
  else status = 'Off Track';

  console.log(`\nProgress ratio: ${(progressRatio * 100).toFixed(1)}%`);
  console.log(`Status: ${status}`);

  // 5. Show discrepancies
  console.log('\n' + '='.repeat(80));
  console.log('\n❌ STEP 5: Discrepancies Found\n');

  console.log('1. Baseline Emissions:');
  console.log(`   Database target: ${target.baseline_emissions} tCO2e`);
  console.log(`   Actual 2023 data: ${actualBaseline.toFixed(2)} tCO2e`);
  console.log(`   Difference: ${(target.baseline_emissions - actualBaseline).toFixed(2)} tCO2e`);

  console.log('\n2. Target Emissions:');
  console.log(`   Database target: ${target.target_emissions} tCO2e`);
  console.log(`   Correct calculation: ${correctTarget.toFixed(2)} tCO2e`);
  console.log(`   Difference: ${(target.target_emissions - correctTarget).toFixed(2)} tCO2e`);

  // 6. Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 STEP 6: Recommended Corrections\n');

  console.log('Update the sustainability_targets record with:');
  console.log(`  baseline_value: ${actualBaseline.toFixed(2)}`);
  console.log(`  baseline_emissions: ${actualBaseline.toFixed(2)}`);
  console.log(`  target_value: ${correctTarget.toFixed(2)}`);
  console.log(`  target_emissions: ${correctTarget.toFixed(2)} (will auto-calculate)`);

  console.log('\n' + '='.repeat(80));
}

auditOverviewData();
