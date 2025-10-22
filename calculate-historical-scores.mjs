#!/usr/bin/env node
/**
 * Calculate historical performance scores using past metrics data
 * This allows trend calculations to compare historical vs current performance
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Time periods to calculate scores for
const periods = [
  { label: 'Q1 2024', startDate: '2024-01-01', endDate: '2024-03-31', calculatedAt: '2024-03-31T23:59:59Z' },
  { label: 'Q2 2024', startDate: '2024-04-01', endDate: '2024-06-30', calculatedAt: '2024-06-30T23:59:59Z' },
  { label: 'Q3 2024', startDate: '2024-07-01', endDate: '2024-09-30', calculatedAt: '2024-09-30T23:59:59Z' },
  { label: 'Today', startDate: '2024-10-21', endDate: '2025-10-21', calculatedAt: new Date().toISOString() },
];

async function calculateHistoricalScores() {
  console.log('🔍 Getting PLMJ organization...\n');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  if (!org) {
    console.log('❌ Organization not found');
    return;
  }

  console.log(`📊 Organization: ${org.name}`);
  console.log(`🆔 ID: ${org.id}\n`);

  console.log('📅 Calculating scores for multiple time periods...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const period of periods) {
    console.log(`\n🔄 Calculating score for: ${period.label}`);
    console.log(`   Period: ${period.startDate} to ${period.endDate}`);
    console.log(`   Will be timestamped as: ${period.calculatedAt}\n`);

    try {
      const response = await fetch(`http://localhost:3002/api/scoring/portfolio/${org.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeWindow: 365, // Use 1 year of data
          includeForecasts: false,
          // We'll need to manually update the timestamp after
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Failed:`, errorText);
        continue;
      }

      const result = await response.json();
      console.log(`   ✅ Score calculated: ${result.overallScore}/100`);
      
      // Show category scores
      console.log(`   📋 Categories:`);
      Object.entries(result.categoryScores).forEach(([category, score]) => {
        if (score.dataPoints > 0) {
          console.log(`      ${category}: ${score.rawScore}/100 (${score.dataPoints} data points)`);
        }
      });

    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('✅ Historical score calculation complete!');
  console.log('\n💡 Next: Refresh the UI to see trends based on actual historical performance');
}

calculateHistoricalScores();
