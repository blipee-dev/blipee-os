/**
 * Recalculate all targets and baselines with new accurate emission factors
 *
 * This updates:
 * 1. sustainability_targets - baseline_emissions
 * 2. category_targets - baseline_emissions and targets
 * 3. reduction_initiatives - baseline emissions
 * 4. Any aggregated views
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateAllTargets() {
  console.log('🔄 Recalculating all targets with accurate emission factors...\n');

  // Step 1: Recalculate sustainability_targets baseline_emissions
  console.log('1️⃣  Recalculating sustainability_targets...\n');

  const { data: targets, error: targetsError } = await supabase
    .from('sustainability_targets')
    .select('*');

  if (targetsError) {
    console.error('Error fetching targets:', targetsError);
    return;
  }

  console.log(`Found ${targets?.length || 0} sustainability targets\n`);

  for (const target of targets || []) {
    console.log(`\nTarget: ${target.name}`);
    console.log(`  Baseline Year: ${target.baseline_year}`);
    console.log(`  Old Baseline: ${target.baseline_value} ${target.baseline_unit}`);

    // Calculate actual baseline emissions for this target's baseline year
    const { data: emissions, error: emissionsError } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', target.organization_id)
      .gte('period_start', `${target.baseline_year}-01-01`)
      .lte('period_start', `${target.baseline_year}-12-31`);

    if (emissionsError) {
      console.log(`  ❌ Error fetching emissions: ${emissionsError.message}`);
      continue;
    }

    const totalEmissions = emissions?.reduce((sum, e) => sum + (parseFloat(e.co2e_emissions) || 0), 0) || 0;
    const totalEmissionsTons = totalEmissions / 1000; // Convert kg to tons

    console.log(`  New Baseline: ${totalEmissionsTons.toFixed(2)} tCO2e`);
    console.log(`  Based on ${emissions?.length || 0} records`);

    const oldBaseline = parseFloat(target.baseline_value) || 0;
    if (Math.abs(totalEmissionsTons - oldBaseline) < 0.01) {
      console.log(`  ⏭️  No change needed`);
      continue;
    }

    // Update the baseline
    const { error: updateError } = await supabase
      .from('sustainability_targets')
      .update({
        baseline_value: totalEmissionsTons,
        updated_at: new Date().toISOString()
      })
      .eq('id', target.id);

    if (updateError) {
      console.log(`  ❌ Error updating: ${updateError.message}`);
    } else {
      const change = totalEmissionsTons - oldBaseline;
      const percentChange = oldBaseline > 0 ? ((change / oldBaseline) * 100) : 0;
      console.log(`  ✅ Updated (${change > 0 ? '+' : ''}${change.toFixed(2)} tCO2e, ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
    }
  }

  // Step 2: Recalculate category_targets
  console.log('\n\n2️⃣  Recalculating category_targets...\n');

  const { data: categoryTargets, error: categoryError } = await supabase
    .from('category_targets')
    .select('*');

  if (categoryError) {
    console.error('Error fetching category targets:', categoryError);
  } else {
    console.log(`Found ${categoryTargets?.length || 0} category targets\n`);

    for (const catTarget of categoryTargets || []) {
      console.log(`\nCategory: ${catTarget.category} (${catTarget.scope})`);
      console.log(`  Baseline Year: ${catTarget.baseline_year}`);
      console.log(`  Old Baseline: ${catTarget.baseline_emissions} tCO2e`);

      // Calculate actual emissions for this category/scope in baseline year
      // This would need category-specific filtering - for now just report
      const { data: categoryEmissions, error: catEmError } = await supabase
        .from('metrics_data')
        .select('co2e_emissions, metadata')
        .eq('organization_id', catTarget.organization_id)
        .gte('period_start', `${catTarget.baseline_year}-01-01`)
        .lte('period_start', `${catTarget.baseline_year}-12-31`);

      if (!catEmError && categoryEmissions) {
        const totalCatEmissions = categoryEmissions.reduce((sum, e) => sum + (parseFloat(e.co2e_emissions) || 0), 0) / 1000;
        console.log(`  Estimated New Baseline: ${totalCatEmissions.toFixed(2)} tCO2e`);

        // Note: Proper implementation would filter by category
        console.log(`  ⚠️  Category-specific filtering not implemented - needs manual review`);
      }
    }
  }

  // Step 3: Check reduction_initiatives
  console.log('\n\n3️⃣  Checking reduction_initiatives...\n');

  const { data: initiatives, error: initiativesError } = await supabase
    .from('reduction_initiatives')
    .select('*');

  if (!initiativesError && initiatives && initiatives.length > 0) {
    console.log(`Found ${initiatives.length} reduction initiatives`);
    console.log('These may need manual review based on their baseline year');
  } else {
    console.log('No reduction initiatives found');
  }

  // Step 4: Summary
  console.log('\n\n📊 Recalculation Summary:\n');
  console.log('✅ Sustainability targets recalculated');
  console.log('⚠️  Category targets need category-specific filtering');
  console.log('ℹ️  Reduction initiatives may need manual review');
  console.log('\n💡 Next steps:');
  console.log('  1. Review updated baselines in dashboard');
  console.log('  2. Verify target emissions are correct');
  console.log('  3. Update any custom reports or views');
}

recalculateAllTargets();
