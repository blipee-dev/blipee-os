#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScores() {
  // Check total count
  const { count } = await supabase
    .from('category_scores')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total category_scores records: ${count || 0}`);

  if (count > 0) {
    // Get some sample records
    const { data: samples } = await supabase
      .from('category_scores')
      .select('category, raw_score, created_at, site_id')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('\n📋 Latest 10 records:');
    samples?.forEach(s => {
      console.log(`  ${s.created_at} - ${s.category}: ${s.raw_score}/100 (site_id: ${s.site_id ? '✅' : '❌'})`);
    });
  }

  // Check performance_scores
  const { count: perfCount } = await supabase
    .from('performance_scores')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total performance_scores records: ${perfCount || 0}`);
}

checkScores();
