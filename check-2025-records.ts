import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function check2025Records() {
  console.log('🔍 Checking 2025 Records\n');
  console.log('='.repeat(80));

  try {
    const { data: records2025, error } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31')
      .order('period_start');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`\n📊 Total 2025 records: ${records2025?.length || 0}`);

    // Group by site_id
    const bySite = new Map<string, number>();
    const withMetadata = [];
    const withoutMetadata = [];

    (records2025 || []).forEach(r => {
      const siteKey = r.site_id || 'null (All Sites)';
      bySite.set(siteKey, (bySite.get(siteKey) || 0) + 1);

      if (r.metadata) {
        withMetadata.push(r);
      } else {
        withoutMetadata.push(r);
      }
    });

    console.log(`\n📍 By Site:`);
    bySite.forEach((count, site) => {
      console.log(`   ${site}: ${count} records`);
    });

    console.log(`\n📝 Metadata Status:`);
    console.log(`   With metadata: ${withMetadata.length}`);
    console.log(`   Without metadata: ${withoutMetadata.length}`);

    // Check for forecast metadata
    const forecasts = withMetadata.filter(r => r.metadata?.is_forecast === true);
    console.log(`\n🤖 ML Forecasts: ${forecasts.length}`);

    if (forecasts.length > 0) {
      console.log(`\n   Sample forecast record:`);
      console.log(`   Period: ${forecasts[0].period_start}`);
      console.log(`   Site ID: ${forecasts[0].site_id || 'null'}`);
      console.log(`   Metadata:`, JSON.stringify(forecasts[0].metadata, null, 2));
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

check2025Records();
