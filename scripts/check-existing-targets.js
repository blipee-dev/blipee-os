/**
 * Check Existing Target Data in Database
 *
 * This script queries the database to understand what target-related data exists:
 * - sustainability_targets (main targets)
 * - category_targets (category-level allocations)
 * - metric_targets (metric-level targets)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.com';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function main() {
  console.log('🔍 Checking Existing Target Data\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check sustainability_targets
    console.log('\n📊 1. SUSTAINABILITY TARGETS (Main Targets)');
    console.log('-'.repeat(80));

    const { data: sustainabilityTargets, error: stError } = await supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (stError) {
      console.error('❌ Error fetching sustainability_targets:', stError.message);
    } else if (!sustainabilityTargets || sustainabilityTargets.length === 0) {
      console.log('⚠️  No sustainability targets found');
    } else {
      console.log(`✅ Found ${sustainabilityTargets.length} sustainability target(s):\n`);
      sustainabilityTargets.forEach((target, idx) => {
        console.log(`   ${idx + 1}. ${target.name}`);
        console.log(`      ID: ${target.id}`);
        console.log(`      Type: ${target.target_type}`);
        console.log(`      Baseline Year: ${target.baseline_year}`);
        console.log(`      Target Year: ${target.target_year}`);
        console.log(`      Baseline: ${target.baseline_value} (${(target.baseline_value / 1000).toFixed(2)} tCO2e)`);
        console.log(`      Target: ${target.target_value} (${(target.target_value / 1000).toFixed(2)} tCO2e)`);
        console.log(`      Status: ${target.status}`);
        console.log('');
      });
    }

    // 2. Check category_targets
    console.log('\n📊 2. CATEGORY TARGETS (Category-Level Allocations)');
    console.log('-'.repeat(80));

    const { data: categoryTargets, error: ctError } = await supabase
      .from('category_targets')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .order('baseline_emissions', { ascending: false });

    if (ctError) {
      console.error('❌ Error fetching category_targets:', ctError.message);
    } else if (!categoryTargets || categoryTargets.length === 0) {
      console.log('⚠️  No category targets found');
      console.log('ℹ️  Category targets are created by the weighted allocation system');
    } else {
      console.log(`✅ Found ${categoryTargets.length} category target(s):\n`);
      categoryTargets.forEach((ct, idx) => {
        console.log(`   ${idx + 1}. ${ct.category}`);
        console.log(`      Baseline Year: ${ct.baseline_year}`);
        console.log(`      Baseline Emissions: ${(ct.baseline_emissions / 1000).toFixed(2)} tCO2e`);
        console.log(`      Target Emissions: ${(ct.target_emissions / 1000).toFixed(2)} tCO2e`);
        console.log(`      Annual Reduction %: ${ct.baseline_target_percent}%`);
        console.log(`      Adjusted Target %: ${ct.adjusted_target_percent}%`);
        console.log(`      Allocation Reason: ${ct.allocation_reason || 'N/A'}`);
        console.log(`      Feasibility: ${ct.feasibility || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Check metric_targets
    console.log('\n📊 3. METRIC TARGETS (Metric-Level Targets)');
    console.log('-'.repeat(80));

    const { data: metricTargets, error: mtError } = await supabase
      .from('metric_targets')
      .select(`
        *,
        metrics_catalog (
          name,
          category,
          scope,
          unit
        )
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .order('baseline_emissions', { ascending: false });

    if (mtError) {
      console.error('❌ Error fetching metric_targets:', mtError.message);
    } else if (!metricTargets || metricTargets.length === 0) {
      console.log('⚠️  No metric targets found');
      console.log('ℹ️  Metric targets need to be created based on category allocations');
    } else {
      console.log(`✅ Found ${metricTargets.length} metric target(s):\n`);

      // Group by category
      const byCategory = metricTargets.reduce((acc, mt) => {
        const category = mt.metrics_catalog?.category || 'Unknown';
        if (!acc[category]) acc[category] = [];
        acc[category].push(mt);
        return acc;
      }, {});

      Object.entries(byCategory).forEach(([category, metrics]) => {
        console.log(`   📁 ${category} (${metrics.length} metrics)`);
        metrics.forEach((mt, idx) => {
          console.log(`      ${idx + 1}. ${mt.metrics_catalog?.name || 'Unknown'}`);
          console.log(`         Baseline: ${(mt.baseline_emissions / 1000).toFixed(2)} tCO2e`);
          console.log(`         Target: ${(mt.target_emissions / 1000).toFixed(2)} tCO2e`);
          console.log(`         Reduction: ${(((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions) * 100).toFixed(1)}%`);
        });
        console.log('');
      });
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Sustainability Targets: ${sustainabilityTargets?.length || 0}`);
    console.log(`Category Targets: ${categoryTargets?.length || 0}`);
    console.log(`Metric Targets: ${metricTargets?.length || 0}`);
    console.log('');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (!sustainabilityTargets || sustainabilityTargets.length === 0) {
      console.log('   ⚠️  Create sustainability targets first (main SBTi targets)');
    }
    if (!categoryTargets || categoryTargets.length === 0) {
      console.log('   ⚠️  Run weighted allocation to create category targets');
    }
    if (!metricTargets || metricTargets.length === 0) {
      console.log('   ⚠️  Run metric target population script to create metric-level targets');
    }
    if (sustainabilityTargets?.length > 0 && categoryTargets?.length > 0 && metricTargets?.length > 0) {
      console.log('   ✅ All target levels exist! The expandable SBTi section should work.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
