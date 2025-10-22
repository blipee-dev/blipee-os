#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createHistoricalSnapshot() {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get latest portfolio score
  const { data: latest } = await supabase
    .from('performance_scores')
    .select(`*, category_scores(*)`)
    .eq('organization_id', org.id)
    .eq('is_portfolio_score', true)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (!latest) {
    console.log('❌ No scores yet! Please:');
    console.log('   1. Open http://localhost:3002');
    console.log('   2. Log in');
    console.log('   3. Go to Sustainability → Overview');
    console.log('   4. Wait for score to calculate');
    console.log('   5. Run this script again\n');
    return;
  }

  // Create historical snapshot (90 days ago, slightly lower scores)
  const historicalDate = new Date();
  historicalDate.setDate(historicalDate.getDate() - 90);

  const { data: historical } = await supabase
    .from('performance_scores')
    .insert({
      organization_id: org.id,
      is_portfolio_score: true,
      overall_score: Math.max(20, latest.overall_score - 5), // Slightly lower
      grade: latest.grade,
      improvement_velocity: latest.improvement_velocity,
      predicted_score_90_days: latest.predicted_score_90_days,
      peer_percentile: latest.peer_percentile,
      rolling_7_day_score: latest.rolling_7_day_score,
      rolling_30_day_score: latest.rolling_30_day_score,
      rolling_90_day_score: latest.rolling_90_day_score,
      rolling_365_day_score: latest.rolling_365_day_score,
      data_completeness: latest.data_completeness,
      confidence_level: latest.confidence_level,
      calculated_at: historicalDate.toISOString(),
      created_at: historicalDate.toISOString(),
    })
    .select()
    .single();

  // Create historical category scores
  const catInserts = latest.category_scores.map(cat => ({
    performance_score_id: historical.id,
    site_id: null,
    category: cat.category,
    raw_score: Math.max(0, cat.raw_score - Math.floor(Math.random() * 10)),
    weighted_score: cat.weighted_score,
    weight: cat.weight,
    percentile: cat.percentile,
    trend: 'stable',
    trend_value: 0,
    data_points: cat.data_points,
    sub_scores: cat.sub_scores,
    insights: cat.insights,
    created_at: historicalDate.toISOString(),
  }));

  await supabase.from('category_scores').insert(catInserts);

  console.log('✅ Historical snapshot created (90 days ago)');
  console.log(`   Old score: ${historical.overall_score}/100`);
  console.log(`   New score: ${latest.overall_score}/100`);
  console.log(`   Change: +${latest.overall_score - historical.overall_score} points\n`);
  console.log('💡 Refresh your browser to see trends!');
}

createHistoricalSnapshot();
