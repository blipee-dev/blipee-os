/**
 * Direct test of recommendations system using Supabase client
 * Bypasses Next.js to isolate the database logic
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecommendations() {
  console.log('🧪 Testing Metric Recommendations System\n');
  console.log('='.repeat(60));

  // Test 1: Check if tables exist and have data
  console.log('\n📊 Test 1: Verify Tables Have Data');
  console.log('-'.repeat(60));

  const { data: materialityCount } = await supabase
    .from('industry_materiality')
    .select('*', { count: 'exact', head: true });
  console.log(`✅ industry_materiality: ${materialityCount?.length || 0} rows`);

  const { data: benchmarkCount } = await supabase
    .from('peer_benchmark_data')
    .select('*', { count: 'exact', head: true });
  console.log(`✅ peer_benchmark_data: ${benchmarkCount?.length || 0} rows`);

  // Test 2: Check materiality data
  console.log('\n📊 Test 2: Sample Industry Materiality Data');
  console.log('-'.repeat(60));

  const { data: materiality } = await supabase
    .from('industry_materiality')
    .select('industry, gri_sector_code, materiality_level, gri_disclosure')
    .limit(5);

  console.table(materiality);

  // Test 3: Check peer benchmarks
  console.log('\n📊 Test 3: Sample Peer Benchmark Data');
  console.log('-'.repeat(60));

  const { data: benchmarks } = await supabase
    .from('peer_benchmark_data')
    .select('industry, region, size_category, metric_type, adoption_percent')
    .limit(5);

  console.table(benchmarks);

  // Test 4: Get organization ID
  console.log('\n📊 Test 4: Find Test Organization');
  console.log('-'.repeat(60));

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found in database');
    return;
  }

  const testOrgId = orgs[0].id;
  console.log(`✅ Using organization: ${orgs[0].name} (${testOrgId})`);

  // Test 5: Call the generate_recommendations_for_org function
  console.log('\n📊 Test 5: Generate Recommendations');
  console.log('-'.repeat(60));

  const { data: recommendations, error: recError } = await supabase
    .rpc('generate_recommendations_for_org', {
      p_organization_id: testOrgId,
      p_industry: 'Services',
      p_region: 'EU',
      p_size_category: '100-300'
    });

  if (recError) {
    console.error('❌ Error generating recommendations:', recError);
    return;
  }

  console.log(`✅ Generated ${recommendations?.length || 0} recommendations`);

  if (recommendations && recommendations.length > 0) {
    console.log('\n🎯 Sample Recommendations:');
    console.table(recommendations.slice(0, 5).map(r => ({
      metric: r.metric_name,
      priority: r.priority,
      peer_adoption: r.peer_adoption_percent + '%',
      gri: r.gri_disclosure
    })));
  }

  // Test 6: Insert recommendations into table
  console.log('\n📊 Test 6: Save Recommendations to Database');
  console.log('-'.repeat(60));

  if (recommendations && recommendations.length > 0) {
    const recsToInsert = recommendations.slice(0, 3).map(rec => ({
      organization_id: testOrgId,
      metric_catalog_id: rec.metric_catalog_id,
      priority: rec.priority,
      recommendation_reason: rec.recommendation_reason,
      peer_adoption_percent: rec.peer_adoption_percent,
      estimated_baseline_value: rec.estimated_baseline_value,
      estimated_baseline_unit: rec.estimated_baseline_unit,
      estimation_confidence: rec.estimation_confidence,
      required_for_frameworks: rec.required_for_frameworks,
      gri_disclosure: rec.gri_disclosure,
      status: 'pending'
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('metric_recommendations')
      .upsert(recsToInsert, {
        onConflict: 'organization_id,metric_catalog_id',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting recommendations:', insertError);
    } else {
      console.log(`✅ Saved ${inserted?.length || 0} recommendations`);
    }
  }

  // Test 7: Fetch saved recommendations
  console.log('\n📊 Test 7: Fetch Saved Recommendations');
  console.log('-'.repeat(60));

  const { data: savedRecs } = await supabase
    .from('metric_recommendations')
    .select(`
      id,
      priority,
      recommendation_reason,
      peer_adoption_percent,
      status,
      metric:metrics_catalog(name, category, scope)
    `)
    .eq('organization_id', testOrgId)
    .eq('status', 'pending')
    .limit(5);

  if (savedRecs && savedRecs.length > 0) {
    console.log(`✅ Found ${savedRecs.length} saved recommendations`);
    console.table(savedRecs.map(r => ({
      metric: r.metric?.name || 'Unknown',
      priority: r.priority,
      adoption: r.peer_adoption_percent + '%',
      status: r.status
    })));
  } else {
    console.log('⚠️  No saved recommendations found');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
}

testRecommendations().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
