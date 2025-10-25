import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkTargets() {
  console.log('🔍 Checking Sustainability Targets\n');

  const { data, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Target Configuration:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Baseline Year: ${data.baseline_year}`);
  console.log(`   Target Year: ${data.target_year}`);
  console.log(`   Baseline Value: ${data.baseline_value || data.baseline_emissions} tCO2e`);
  console.log(`   Target Value: ${data.target_value || data.target_emissions} tCO2e`);
  console.log(`   Target Reduction %: ${data.target_reduction_percent}%`);
  console.log(`   Emissions Reduction %: ${data.emissions_reduction_percent}%`);
  console.log(`   Energy Reduction %: ${data.energy_reduction_percent}%`);
  console.log(`   Water Reduction %: ${data.water_reduction_percent}%`);
  console.log(`   Waste Reduction %: ${data.waste_reduction_percent}%`);
  console.log(`   Is Active: ${data.is_active}`);

  // Calculate what the target SHOULD be
  const years = 2025 - data.baseline_year; // 2 years
  const baselineEmissions = data.baseline_value || data.baseline_emissions || 413.4;
  const reductionPercent = data.emissions_reduction_percent || data.target_reduction_percent;

  console.log(`\n🧮 Interpretation Check:`);
  console.log(`   Years since baseline: ${years}`);
  console.log(`   Reduction percent: ${reductionPercent}%`);

  // Interpretation 1: Linear reduction per year
  const linearTarget = baselineEmissions * (1 - (reductionPercent / 100) * years);
  console.log(`\n   📐 If ${reductionPercent}% PER YEAR (linear):`);
  console.log(`      Formula: ${baselineEmissions} × (1 - ${reductionPercent/100} × ${years})`);
  console.log(`      2025 Target: ${linearTarget.toFixed(1)} tCO2e`);

  // Interpretation 2: Total reduction by target year (annualized)
  const totalYears = data.target_year - data.baseline_year; // 2030 - 2023 = 7 years
  const annualRate = reductionPercent / totalYears;
  const annualizedTarget = baselineEmissions * (1 - (annualRate / 100) * years);
  console.log(`\n   📊 If ${reductionPercent}% TOTAL by ${data.target_year} (annualized):`);
  console.log(`      Annual rate: ${annualRate.toFixed(2)}% per year`);
  console.log(`      Formula: ${baselineEmissions} × (1 - ${annualRate.toFixed(2)}/100 × ${years})`);
  console.log(`      2025 Target: ${annualizedTarget.toFixed(1)} tCO2e`);

  // Interpretation 3: Compound reduction per year
  const compoundTarget = baselineEmissions * Math.pow(1 - reductionPercent / 100, years);
  console.log(`\n   📈 If ${reductionPercent}% PER YEAR (compound):`);
  console.log(`      Formula: ${baselineEmissions} × (1 - ${reductionPercent/100})^${years}`);
  console.log(`      2025 Target: ${compoundTarget.toFixed(1)} tCO2e`);

  console.log(`\n✅ Current UnifiedCalculator uses: Linear per year`);
  console.log(`   Result: ${linearTarget.toFixed(1)} tCO2e`);
}

checkTargets().catch(console.error);
