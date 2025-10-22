#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScores() {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log(`📊 Organization: ${org.name} (${org.id})\n`);

  // Check performance_scores
  const { data: scores, error } = await supabase
    .from('performance_scores')
    .select('*')
    .eq('organization_id', org.id)
    .order('calculated_at', { ascending: false });

  console.log(`📈 Performance Scores: ${scores?.length || 0} found`);
  
  if (scores && scores.length > 0) {
    scores.forEach((s, i) => {
      console.log(`\n${i + 1}. Score: ${s.overall_score}/100`);
      console.log(`   Portfolio: ${s.is_portfolio_score}`);
      console.log(`   Calculated: ${s.calculated_at}`);
      console.log(`   ID: ${s.id}`);
    });
  } else {
    console.log('   No scores found - need to calculate one!');
  }

  // Check category_scores
  const { data: catScores } = await supabase
    .from('category_scores')
    .select('category, raw_score, created_at, site_id')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log(`\n📋 Category Scores: ${catScores?.length || 0} found`);
  if (catScores && catScores.length > 0) {
    catScores.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.category}: ${c.raw_score}/100 (${c.created_at}, site_id: ${c.site_id ? '✅' : '❌'})`);
    });
  }
}

checkScores();
