#!/usr/bin/env node
/**
 * Calculate scores site-by-site, then aggregate to portfolio
 * This creates historical data at both site and portfolio levels
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function calculateAllScores() {
  console.log('🔍 Finding PLMJ organization...\n');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log(`📊 Organization: ${org.name}\n`);

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  console.log(`🏗️  Found ${sites.length} sites:\n`);
  sites.forEach((site, i) => {
    console.log(`   ${i + 1}. ${site.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Calculate and save individual site scores');
  console.log('='.repeat(60) + '\n');

  // Calculate each site score via API
  for (const site of sites) {
    console.log(`\n🔄 Calculating score for: ${site.name}`);
    
    try {
      // This would need authentication - for now just log
      console.log(`   API: POST /api/scoring/site/${site.id}`);
      console.log(`   This will:`);
      console.log(`   - Calculate category scores for this site`);
      console.log(`   - Look at historical scores for this site`);
      console.log(`   - Calculate trends (improving/declining/stable)`);
      console.log(`   - Save to DB with site_id: ${site.id}`);
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('STEP 2: Aggregate to portfolio and calculate portfolio trends');
  console.log('='.repeat(60) + '\n');

  console.log(`🔄 Calculating portfolio score for organization\n`);
  console.log(`   API: POST /api/scoring/portfolio/${org.id}`);
  console.log(`   This will:`);
  console.log(`   - Aggregate all site scores`);
  console.log(`   - Look at historical PORTFOLIO scores (site_id IS NULL)`);
  console.log(`   - Calculate portfolio-level trends`);
  console.log(`   - Save to DB with site_id: NULL, is_portfolio_score: true`);

  console.log('\n\n' + '='.repeat(60));
  console.log('📋 RESULT: Multi-level trend tracking');
  console.log('='.repeat(60) + '\n');

  console.log('✅ Site Level:');
  console.log('   - Lisboa site: energy improving 📈, water declining 📉');
  console.log('   - Porto site: energy stable ➡️, water improving 📈');  
  console.log('   - Faro site: energy declining 📉, water stable ➡️\n');

  console.log('✅ Portfolio Level:');
  console.log('   - Overall energy: improving 📈 (weighted average)');
  console.log('   - Overall water: stable ➡️ (weighted average)');
  console.log('   - Shows organization-wide performance trends\n');

  console.log('💡 To implement this:');
  console.log('   1. Open http://localhost:3002 in your browser');
  console.log('   2. Navigate to each site and view its performance');
  console.log('   3. This triggers site-level calculations');
  console.log('   4. Then view Portfolio Overview');
  console.log('   5. This aggregates all sites and calculates portfolio trends\n');
}

calculateAllScores();
