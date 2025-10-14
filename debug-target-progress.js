const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugTargetProgress() {
  console.log('🎯 Debugging Target Progress Card\n');

  // Get the target
  const { data: target } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .single();

  console.log('📊 Target Data:');
  console.log('  Name:', target.name);
  console.log('  Baseline Year:', target.baseline_year);
  console.log('  Baseline Emissions:', target.baseline_value, 'tCO2e');
  console.log('  Target Year:', target.target_year);
  console.log('  Target Emissions:', target.target_value, 'tCO2e');
  console.log('  Current Emissions (stored):', target.current_emissions, 'tCO2e');
  console.log('  Status:', target.status);
  console.log('');

  // Calculate what current emissions SHOULD be (2025 YTD actual)
  const currentYear = new Date().getFullYear();

  // Get actual 2025 emissions
  const { data: emissions2025 } = await supabase.rpc('get_scope_analysis', {
    p_organization_id: ORG_ID,
    p_start_date: '2025-01-01',
    p_end_date: '2025-12-31'
  });

  if (emissions2025) {
    const total2025 = (emissions2025.scope_1?.total || 0) +
                      (emissions2025.scope_2?.total || 0) +
                      (emissions2025.scope_3?.total || 0);

    console.log('📊 Actual 2025 Emissions (YTD):');
    console.log('  Scope 1:', emissions2025.scope_1?.total || 0, 'tCO2e');
    console.log('  Scope 2:', emissions2025.scope_2?.total || 0, 'tCO2e');
    console.log('  Scope 3:', emissions2025.scope_3?.total || 0, 'tCO2e');
    console.log('  Total:', total2025.toFixed(1), 'tCO2e');
    console.log('');
  }

  // Calculate linear trajectory
  const baseline = target.baseline_value;
  const baselineYear = target.baseline_year;
  const targetValue = target.target_value;
  const targetYear = target.target_year;

  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;
  const totalReduction = baseline - targetValue;
  const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
  const requiredEmissions = baseline - requiredReduction;

  console.log('📈 Linear Trajectory Calculation:');
  console.log('  Baseline (2023):', baseline, 'tCO2e');
  console.log('  Target (2030):', targetValue, 'tCO2e');
  console.log('  Total reduction needed:', totalReduction.toFixed(1), 'tCO2e');
  console.log('  Years elapsed:', yearsElapsed, '/', totalYears);
  console.log('  Required reduction by now:', requiredReduction.toFixed(1), 'tCO2e');
  console.log('  Required emissions for', currentYear + ':', requiredEmissions.toFixed(1), 'tCO2e');
  console.log('');

  // Check if on track
  const currentEmissions = target.current_emissions;
  const tolerance = requiredEmissions * 1.1; // 10% tolerance
  const isOnTrack = currentEmissions <= tolerance;

  console.log('🎯 Target Status:');
  console.log('  Current emissions:', currentEmissions, 'tCO2e');
  console.log('  Required emissions:', requiredEmissions.toFixed(1), 'tCO2e');
  console.log('  With 10% tolerance:', tolerance.toFixed(1), 'tCO2e');
  console.log('  Gap:', (currentEmissions - requiredEmissions).toFixed(1), 'tCO2e');
  console.log('  On track?', isOnTrack ? '✅ YES' : '❌ NO');
  console.log('');

  // What should current_emissions be?
  console.log('💡 Analysis:');
  if (currentEmissions > baseline) {
    console.log('  ⚠️  Current emissions are HIGHER than baseline!');
    console.log('  ⚠️  This means emissions increased instead of decreased');
    console.log('  ⚠️  The current_emissions field needs to be updated with actual 2025 YTD data');
  } else {
    const actualReduction = baseline - currentEmissions;
    const actualReductionPercent = (actualReduction / baseline) * 100;
    const requiredReductionPercent = (requiredReduction / baseline) * 100;

    console.log('  Actual reduction:', actualReduction.toFixed(1), 'tCO2e (', actualReductionPercent.toFixed(1), '%)');
    console.log('  Required reduction:', requiredReduction.toFixed(1), 'tCO2e (', requiredReductionPercent.toFixed(1), '%)');
  }
}

debugTargetProgress().catch(console.error);
