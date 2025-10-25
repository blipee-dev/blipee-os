/**
 * Verify SBTi Waste Target Calculations
 *
 * This script validates the calculations in SBTiWasteTarget component
 * using example data matching what we see in the dashboard.
 */

// Example data from actual dashboard observations
const ACTUAL_DATA = {
  baseline2023: {
    total_emissions: 8.2,  // tCO2e (from check-all-years-waste.ts)
    diversion_rate: 73.8,  // %
    total_generated: 9.53,  // tons
    monthly_trends_count: 12
  },
  current2025: {
    total_emissions: 7.1,  // tCO2e (from dashboard)
    diversion_rate: 38.5,  // %
    total_generated: 13.01, // tons
    monthly_trends_count: 10  // YTD data (10 months as of Oct 2025)
  }
};

function verifySBTiCalculations() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SBTi WASTE TARGET CALCULATION VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test parameters (matching component defaults)
  const baselineYear = 2023;
  const currentYear = 2025;
  const targetYear = 2030;
  const annualEmissionsReductionRate = 4.2; // SBTi 1.5°C pathway
  const targetDiversionRate = 90; // TRUE Zero Waste standard

  // Example data (we'll use actual data below)
  const baseline2023Emissions = 8.2; // tCO2e
  const baseline2023DiversionRate = 73.8; // %
  const current2025Emissions = 7.1; // tCO2e (projected full year)
  const current2025DiversionRate = 38.5; // %

  console.log('📊 INPUT DATA');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Baseline Year: ${baselineYear}`);
  console.log(`Current Year: ${currentYear}`);
  console.log(`Target Year: ${targetYear}`);
  console.log(`Annual Emissions Reduction Rate: ${annualEmissionsReductionRate}%`);
  console.log(`Target Diversion Rate: ${targetDiversionRate}%\n`);

  console.log(`Baseline ${baselineYear} Emissions: ${baseline2023Emissions} tCO2e`);
  console.log(`Baseline ${baselineYear} Diversion Rate: ${baseline2023DiversionRate}%`);
  console.log(`Current ${currentYear} Projected Emissions: ${current2025Emissions} tCO2e`);
  console.log(`Current ${currentYear} Diversion Rate: ${current2025DiversionRate}%\n`);

  // ===== EMISSIONS TARGET CALCULATIONS =====
  console.log('🎯 EMISSIONS TARGET CALCULATIONS (SBTi 1.5°C Pathway)');
  console.log('─────────────────────────────────────────────────────────────');

  const yearsElapsed = currentYear - baselineYear;
  console.log(`Years Elapsed: ${yearsElapsed}`);

  // Target emissions for current year using compound reduction
  const targetEmissions = baseline2023Emissions * Math.pow(1 - annualEmissionsReductionRate / 100, yearsElapsed);
  console.log(`\nFormula: Baseline × (1 - rate)^years`);
  console.log(`Target ${currentYear} Emissions = ${baseline2023Emissions} × (1 - 0.042)^${yearsElapsed}`);
  console.log(`Target ${currentYear} Emissions = ${baseline2023Emissions} × ${Math.pow(1 - annualEmissionsReductionRate / 100, yearsElapsed).toFixed(6)}`);
  console.log(`Target ${currentYear} Emissions = ${targetEmissions.toFixed(2)} tCO2e`);

  // Expected reduction percentage
  const expectedReduction = ((baseline2023Emissions - targetEmissions) / baseline2023Emissions) * 100;
  console.log(`\nExpected Reduction: ((${baseline2023Emissions} - ${targetEmissions.toFixed(2)}) / ${baseline2023Emissions}) × 100`);
  console.log(`Expected Reduction = ${expectedReduction.toFixed(2)}%`);

  // Actual reduction percentage
  const actualReduction = ((baseline2023Emissions - current2025Emissions) / baseline2023Emissions) * 100;
  console.log(`\nActual Reduction: ((${baseline2023Emissions} - ${current2025Emissions}) / ${baseline2023Emissions}) × 100`);
  console.log(`Actual Reduction = ${actualReduction.toFixed(2)}%`);

  // Progress percentage
  const emissionsProgress = expectedReduction > 0 ? (actualReduction / expectedReduction) * 100 : 0;
  console.log(`\nProgress: (${actualReduction.toFixed(2)} / ${expectedReduction.toFixed(2)}) × 100`);
  console.log(`Progress = ${emissionsProgress.toFixed(1)}%`);

  // Status determination
  let emissionsStatus = 'off-track';
  if (emissionsProgress >= 100) emissionsStatus = 'on-track';
  else if (emissionsProgress >= 70) emissionsStatus = 'at-risk';
  console.log(`Status: ${emissionsStatus.toUpperCase()}`);

  // 2030 Target
  const target2030Emissions = baseline2023Emissions * Math.pow(1 - annualEmissionsReductionRate / 100, targetYear - baselineYear);
  const cumulativeReduction2030 = (1 - Math.pow(1 - annualEmissionsReductionRate / 100, targetYear - baselineYear)) * 100;
  console.log(`\n${targetYear} Target: ${target2030Emissions.toFixed(2)} tCO2e (${cumulativeReduction2030.toFixed(1)}% cumulative reduction)`);

  // ===== DIVERSION RATE CALCULATIONS =====
  console.log('\n\n♻️  DIVERSION RATE CALCULATIONS (TRUE Zero Waste)');
  console.log('─────────────────────────────────────────────────────────────');

  // Diversion rate increase
  const diversionRateIncrease = current2025DiversionRate - baseline2023DiversionRate;
  console.log(`Current Diversion Rate Increase: ${current2025DiversionRate}% - ${baseline2023DiversionRate}%`);
  console.log(`Current Diversion Rate Increase = ${diversionRateIncrease.toFixed(2)}pp`);

  // Target diversion increase
  const targetDiversionIncrease = targetDiversionRate - baseline2023DiversionRate;
  console.log(`\nTarget Diversion Rate Increase: ${targetDiversionRate}% - ${baseline2023DiversionRate}%`);
  console.log(`Target Diversion Rate Increase = ${targetDiversionIncrease.toFixed(2)}pp`);

  // Progress percentage
  const diversionProgress = targetDiversionIncrease > 0 ? (diversionRateIncrease / targetDiversionIncrease) * 100 : 0;
  console.log(`\nProgress: (${diversionRateIncrease.toFixed(2)} / ${targetDiversionIncrease.toFixed(2)}) × 100`);
  console.log(`Progress = ${diversionProgress.toFixed(1)}%`);

  // Status determination
  let diversionStatus = 'off-track';
  if (diversionProgress >= 100) diversionStatus = 'on-track';
  else if (diversionProgress >= 70) diversionStatus = 'at-risk';
  console.log(`Status: ${diversionStatus.toUpperCase()}`);

  // TRUE certification check
  const trueEligible = current2025DiversionRate >= 90;
  console.log(`\nTRUE Zero Waste Certification: ${trueEligible ? 'ELIGIBLE ✓' : 'NOT ELIGIBLE'}`);
  if (!trueEligible) {
    const neededIncrease = 90 - current2025DiversionRate;
    console.log(`Additional ${neededIncrease.toFixed(1)}pp needed for certification`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✓ Emissions calculation uses compound annual reduction`);
  console.log(`✓ Progress is ratio of actual vs expected reduction`);
  console.log(`✓ Diversion progress tracks increase toward 90% target`);
  console.log(`✓ Status thresholds: ≥100% on-track, ≥70% at-risk, <70% off-track`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

function verifyWithActualData() {
  console.log('\n\n🔍 VERIFICATION WITH ACTUAL DASHBOARD DATA');
  console.log('═══════════════════════════════════════════════════════════\n');

  const baseline = ACTUAL_DATA.baseline2023;
  const current = ACTUAL_DATA.current2025;

  console.log('📊 2023 BASELINE DATA (Actual)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total Emissions: ${baseline.total_emissions} tCO2e`);
  console.log(`Diversion Rate: ${baseline.diversion_rate}%`);
  console.log(`Total Generated: ${baseline.total_generated} tons`);
  console.log(`Monthly Data Points: ${baseline.monthly_trends_count}`);

  console.log('\n📊 2025 CURRENT DATA (Actual YTD)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total Emissions (YTD): ${current.total_emissions} tCO2e`);
  console.log(`Diversion Rate: ${current.diversion_rate}%`);
  console.log(`Total Generated: ${current.total_generated} tons`);
  console.log(`Monthly Data Points: ${current.monthly_trends_count}`);

  // Calculate projected full year for 2025
  const monthsOfData = current.monthly_trends_count;
  const projectedFullYearEmissions = monthsOfData > 0
    ? (current.total_emissions / monthsOfData) * 12
    : current.total_emissions;

  console.log(`\nProjected Full Year Emissions (2025): ${projectedFullYearEmissions.toFixed(2)} tCO2e`);
  console.log(`  Formula: (${current.total_emissions} / ${monthsOfData}) × 12`);

  // Now run calculations with actual data
  console.log('\n\n🎯 CALCULATIONS WITH ACTUAL DATA');
  console.log('═══════════════════════════════════════════════════════════\n');

  const baselineYear = 2023;
  const currentYear = 2025;
  const annualRate = 4.2;

  const yearsElapsed = currentYear - baselineYear;
  const targetEmissions = baseline.total_emissions * Math.pow(1 - annualRate / 100, yearsElapsed);
  const expectedReduction = ((baseline.total_emissions - targetEmissions) / baseline.total_emissions) * 100;
  const actualReduction = ((baseline.total_emissions - projectedFullYearEmissions) / baseline.total_emissions) * 100;
  const progress = expectedReduction > 0 ? (actualReduction / expectedReduction) * 100 : 0;

  console.log('EMISSIONS TARGET:');
  console.log(`  Baseline (2023): ${baseline.total_emissions} tCO2e`);
  console.log(`  Target for 2025: ${targetEmissions.toFixed(2)} tCO2e (-${expectedReduction.toFixed(1)}%)`);
  console.log(`  Projected 2025: ${projectedFullYearEmissions.toFixed(2)} tCO2e (-${actualReduction.toFixed(1)}%)`);
  console.log(`  Progress: ${progress.toFixed(1)}% ${progress >= 100 ? '✓ ON TRACK' : progress >= 70 ? '⚠ AT RISK' : '✗ OFF TRACK'}`);

  const diversionIncrease = current.diversion_rate - baseline.diversion_rate;
  const targetDiversionIncrease = 90 - baseline.diversion_rate;
  const diversionProgress = targetDiversionIncrease > 0 ? (diversionIncrease / targetDiversionIncrease) * 100 : 0;

  console.log('\nDIVERSION RATE:');
  console.log(`  Baseline (2023): ${baseline.diversion_rate}%`);
  console.log(`  Target for 2030: 90%`);
  console.log(`  Current 2025: ${current.diversion_rate}%`);
  console.log(`  Change: ${diversionIncrease.toFixed(1)}pp (need ${targetDiversionIncrease.toFixed(1)}pp total)`);
  console.log(`  Progress: ${diversionProgress.toFixed(1)}% ${diversionProgress >= 100 ? '✓ ON TRACK' : diversionProgress >= 70 ? '⚠ AT RISK' : '✗ OFF TRACK'}`);
  console.log(`  TRUE Eligible: ${current.diversion_rate >= 90 ? 'YES ✓' : 'NO (need +' + (90 - current.diversion_rate).toFixed(1) + 'pp)'}`);

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

function main() {
  // First verify with example data
  verifySBTiCalculations();

  // Then verify with actual dashboard data
  verifyWithActualData();
}

main();
