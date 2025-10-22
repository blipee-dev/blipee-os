#!/usr/bin/env node
/**
 * Trigger performance score recalculation
 * This will calculate fresh scores with real trend data from historical records
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function recalculateScore() {
  console.log('🔍 Finding organizations and sites...\n');

  // Get organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);

  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError);
    return;
  }

  if (!orgs || orgs.length === 0) {
    console.log('No organizations found');
    return;
  }

  console.log('📊 Organizations:');
  orgs.forEach((org, i) => {
    console.log(`  ${i + 1}. ${org.name} (${org.id})`);
  });

  // Get sites for first organization
  const orgId = orgs[0].id;
  console.log(`\n🏢 Using organization: ${orgs[0].name}`);

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', orgId);

  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError);
    return;
  }

  console.log(`\n🏗️  Sites (${sites?.length || 0}):`);
  sites?.forEach((site, i) => {
    console.log(`  ${i + 1}. ${site.name} (${site.id})`);
  });

  // Make POST request to recalculate portfolio score
  console.log(`\n🔄 Triggering portfolio score recalculation...\n`);

  try {
    const response = await fetch(`http://localhost:3002/api/scoring/portfolio/${orgId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Recalculation failed:', response.status, errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ Portfolio Score Recalculated!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📈 Overall Score: ${result.overallScore}/100 (${result.grade})`);
    console.log(`📊 Data Completeness: ${result.dataCompleteness}%`);
    console.log(`🎯 Confidence: ${result.confidenceLevel}`);
    console.log(`📉 Improvement Velocity: ${result.improvementVelocity}`);
    console.log(`🔮 Predicted 90-day: ${result.predictedScore90Days}/100`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Category Scores with REAL TRENDS:\n');
    Object.entries(result.categoryScores).forEach(([category, score]) => {
      const trendIcon = score.trend === 'improving' ? '📈' :
                        score.trend === 'declining' ? '📉' : '➡️';
      console.log(`${trendIcon} ${category.padEnd(18)} ${score.rawScore}/100`);
      console.log(`   Trend: ${score.trend} (${score.trendValue > 0 ? '+' : ''}${score.trendValue.toFixed(2)}%)`);
      console.log(`   Weight: ${(score.weight * 100).toFixed(1)}%, Weighted Score: ${score.weightedScore.toFixed(2)}`);
      console.log(`   Data Points: ${score.dataPoints}, Percentile: ${score.percentile}th`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

recalculateScore();
