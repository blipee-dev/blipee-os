#!/usr/bin/env node
/**
 * Direct performance score recalculation (bypasses API auth)
 * Uses service role to directly call the scoring engine
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// This is a simplified version of the scoring logic for testing
async function recalculateScoreDirect() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Finding PLMJ organization...\n');

  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  if (!org) {
    console.log('❌ PLMJ organization not found');
    return;
  }

  console.log(`📊 Organization: ${org.name} (${org.id})\n`);

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  console.log(`🏗️  Sites (${sites?.length || 0}):`);
  sites?.forEach((site, i) => {
    console.log(`  ${i + 1}. ${site.name} (${site.id})`);
  });

  // Check for existing category scores with trend data
  console.log('\n📈 Checking historical category scores...\n');

  for (const site of sites || []) {
    console.log(`\n🏢 ${site.name}:`);

    // Get historical scores for this site (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data: historicalScores, error } = await supabase
      .from('category_scores')
      .select('category, raw_score, created_at, site_id')
      .eq('site_id', site.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`   ❌ Error fetching historical scores:`, error.message);
      continue;
    }

    if (!historicalScores || historicalScores.length === 0) {
      console.log('   ⚠️  No historical data in last 90 days');
      continue;
    }

    console.log(`   ✅ Found ${historicalScores.length} historical score records`);

    // Group by category
    const byCategory = {};
    historicalScores.forEach(score => {
      if (!byCategory[score.category]) {
        byCategory[score.category] = [];
      }
      byCategory[score.category].push({
        score: score.raw_score,
        date: score.created_at
      });
    });

    // Calculate trends for each category
    console.log('   📊 Category trends (based on last 90 days):');
    Object.entries(byCategory).forEach(([category, scores]) => {
      if (scores.length < 2) {
        console.log(`      ${category}: Not enough data (${scores.length} records)`);
        return;
      }

      // Split into two periods
      const midpoint = Math.floor(scores.length / 2);
      const olderScores = scores.slice(0, midpoint);
      const recentScores = scores.slice(midpoint);

      const olderAvg = olderScores.reduce((sum, s) => sum + s.score, 0) / olderScores.length;
      const recentAvg = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;

      const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      const trendDirection = trend > 0.5 ? 'improving 📈' :
                            trend < -0.5 ? 'declining 📉' :
                            'stable ➡️';

      console.log(`      ${category.padEnd(18)} ${trendDirection} (${trend > 0 ? '+' : ''}${trend.toFixed(2)}%)`);
      console.log(`         Older avg: ${olderAvg.toFixed(1)}, Recent avg: ${recentAvg.toFixed(1)} (${scores.length} records)`);
    });
  }

  console.log('\n\n✅ Analysis complete!');
  console.log('\n💡 To see these trends in the UI:');
  console.log('   1. Navigate to http://localhost:3002');
  console.log('   2. Go to the Sustainability Overview page');
  console.log('   3. The Category Scores will show real trends based on your historical data\n');
}

recalculateScoreDirect();
