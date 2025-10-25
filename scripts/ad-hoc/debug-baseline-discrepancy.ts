import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { getPeriodEmissions } from './src/lib/sustainability/baseline-calculator';
import { UnifiedSustainabilityCalculator } from './src/lib/sustainability/unified-calculator';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugBaselineDiscrepancy() {
  console.log('🔍 Debugging Baseline Emissions Discrepancy\n');
  console.log('='.repeat(80));

  // Method 1: From sustainability_targets table
  console.log('\n📋 Method 1: From sustainability_targets table');
  console.log('─'.repeat(80));
  const { data: target } = await supabaseAdmin
    .from('sustainability_targets')
    .select('baseline_year, baseline_value, baseline_emissions')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  console.log(`Baseline Value: ${target?.baseline_value} tCO2e`);
  console.log(`Baseline Emissions: ${target?.baseline_emissions} tCO2e`);
  console.log(`Baseline Year: ${target?.baseline_year}`);

  // Method 2: Using baseline-calculator (getPeriodEmissions)
  console.log('\n📊 Method 2: Using baseline-calculator.getPeriodEmissions()');
  console.log('─'.repeat(80));
  const calculatedEmissions = await getPeriodEmissions(
    organizationId,
    '2023-01-01',
    '2023-12-31'
  );
  console.log(`Total: ${calculatedEmissions.total} tCO2e`);
  console.log(`Scope 1: ${calculatedEmissions.scope_1} tCO2e`);
  console.log(`Scope 2: ${calculatedEmissions.scope_2} tCO2e`);
  console.log(`Scope 3: ${calculatedEmissions.scope_3} tCO2e`);

  // Method 3: Using UnifiedSustainabilityCalculator
  console.log('\n🧮 Method 3: Using UnifiedSustainabilityCalculator');
  console.log('─'.repeat(80));
  const calculator = new UnifiedSustainabilityCalculator(organizationId);
  const baseline = await calculator.getBaseline('emissions', 2023);
  console.log(`Baseline: ${baseline?.value} tCO2e`);

  // Method 4: Direct database query
  console.log('\n🗄️  Method 4: Direct database query');
  console.log('─'.repeat(80));
  const { data: metricsData } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog!inner(scope)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01');

  let scope1Sum = 0, scope2Sum = 0, scope3Sum = 0;
  metricsData?.forEach(d => {
    const emissions = d.co2e_emissions || 0;
    const scope = (d.metrics_catalog as any)?.scope;
    if (scope === 'scope_1') scope1Sum += emissions;
    else if (scope === 'scope_2') scope2Sum += emissions;
    else if (scope === 'scope_3') scope3Sum += emissions;
  });

  const totalKg = scope1Sum + scope2Sum + scope3Sum;
  const totalTonnes = totalKg / 1000;

  console.log(`Total Records: ${metricsData?.length}`);
  console.log(`Total (raw sum): ${totalTonnes.toFixed(1)} tCO2e`);
  console.log(`Scope 1 (raw): ${(scope1Sum/1000).toFixed(1)} tCO2e`);
  console.log(`Scope 2 (raw): ${(scope2Sum/1000).toFixed(1)} tCO2e`);
  console.log(`Scope 3 (raw): ${(scope3Sum/1000).toFixed(1)} tCO2e`);

  // Show the discrepancy
  console.log('\n⚠️  DISCREPANCY ANALYSIS');
  console.log('─'.repeat(80));
  const targetValue = target?.baseline_value || 0;
  const calculatedValue = calculatedEmissions.total;
  const difference = targetValue - calculatedValue;

  console.log(`sustainability_targets.baseline_value: ${targetValue} tCO2e`);
  console.log(`Calculated from metrics_data: ${calculatedValue} tCO2e`);
  console.log(`Difference: ${difference.toFixed(1)} tCO2e`);
  console.log(`Percentage difference: ${((difference/targetValue)*100).toFixed(1)}%`);

  if (Math.abs(difference) > 1) {
    console.log('\n🔍 Possible Causes:');
    console.log('   1. sustainability_targets.baseline_value was manually set');
    console.log('   2. Some metrics were added/removed after target was created');
    console.log('   3. Rounding differences in the target calculation');
    console.log('   4. Different date range interpretation');
  }

  console.log('\n💡 RECOMMENDATION:');
  console.log('─'.repeat(80));
  console.log('The UnifiedCalculator should use CALCULATED emissions from metrics_data,');
  console.log('not the baseline_value from sustainability_targets table.');
  console.log('This ensures consistency with actual data.');

  console.log('\n' + '='.repeat(80));
}

debugBaselineDiscrepancy().catch(console.error);
