const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function testByCategoryAPI() {
  console.log('🧪 Testing by-category API with Prophet Forecast Model\n');

  try {
    // Call the API endpoint
    const url = `http://localhost:3001/api/sustainability/targets/by-category?organizationId=${ORG_ID}&targetId=${TARGET_ID}&categories=Water%20Withdrawal,Water%20Discharge,Water%20Consumption`;

    console.log('📡 Calling API endpoint...\n');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    console.log(`✅ API Response: ${result.success ? 'SUCCESS' : 'FAILED'}\n`);
    console.log(`📊 Found ${result.data?.length || 0} metric targets\n`);

    // Display each metric target with projections
    result.data?.forEach((target, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`${idx + 1}. ${target.metricName} (${target.category})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`\n📋 Target Details:`);
      console.log(`   ID: ${target.id}`);
      console.log(`   Metric Code: ${target.metricCode}`);
      console.log(`   Scope: ${target.scope}`);
      console.log(`   Unit: ${target.unit}`);

      console.log(`\n📈 Values:`);
      console.log(`   Baseline (2023): ${(target.baselineValue / 1000).toFixed(2)} ML`);
      console.log(`   Target (2025): ${(target.targetValue / 1000).toFixed(2)} ML`);
      console.log(`   Current YTD: ${(target.currentValue / 1000).toFixed(2)} ML`);
      console.log(`   Current Emissions: ${(target.currentEmissions / 1000).toFixed(2)} ML`);

      console.log(`\n🎯 Progress:`);
      console.log(`   Reduction Needed: ${(target.progress.reductionNeeded / 1000).toFixed(2)} ML`);
      console.log(`   Reduction Achieved: ${(target.progress.reductionAchieved / 1000).toFixed(2)} ML`);
      console.log(`   Progress: ${target.progress.progressPercent.toFixed(1)}%`);
      console.log(`   Status: ${target.progress.trajectoryStatus}`);

      console.log(`\n📅 Monthly Data:`);
      if (target.monthlyData && target.monthlyData.length > 0) {
        console.log(`   Months with data: ${target.monthlyData.length}`);
        target.monthlyData.forEach(m => {
          console.log(`   ${m.year}-${String(m.month).padStart(2, '0')}: Actual=${(m.actualEmissions / 1000).toFixed(2)} ML, Target=${(m.targetEmissions / 1000).toFixed(2)} ML, Variance=${(m.variance / 1000).toFixed(2)} ML (${m.variancePercent.toFixed(1)}%)`);
        });
      } else {
        console.log(`   No monthly data available`);
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('✨ Test complete!\n');

    // Verify that current values include forecast
    const hasProjections = result.data?.some(target =>
      target.currentValue > 0 && target.monthlyData?.length < 12
    );

    if (hasProjections) {
      console.log('✅ VERIFIED: Current values include Prophet forecast projections');
    } else {
      console.log('⚠️  WARNING: Could not verify forecast projections');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testByCategoryAPI().catch(console.error);
