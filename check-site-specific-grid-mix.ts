import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkSiteSpecificGridMix() {
  console.log('🔍 Checking Grid Mix for Each Site (2025)\n');
  console.log('='.repeat(80));

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', organizationId);

  // Get electricity metrics
  const { data: electricityMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, code')
    .eq('energy_type', 'electricity');

  const metricIds = electricityMetrics.map(m => m.id);

  console.log(`\nFound ${sites.length} sites\n`);

  for (const site of sites) {
    console.log(`📍 ${site.name} (${site.id})`);
    console.log('─'.repeat(80));

    // Get 2025 electricity records for this site
    const { data: records } = await supabase
      .from('metrics_data')
      .select('period_start, value, metadata')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .eq('site_id', site.id)
      .gte('period_start', '2025-01-01')
      .lt('period_start', '2026-01-01')
      .order('period_start');

    console.log(`Total records: ${records.length}`);

    if (records.length === 0) {
      console.log('⚠️  No electricity records found for this site\n');
      continue;
    }

    // Check grid mix
    let totalRenewable = 0;
    let totalNonRenewable = 0;
    let withGridMix = 0;
    let withoutGridMix = 0;

    records.forEach(r => {
      const gridMix = r.metadata?.grid_mix;
      if (gridMix && typeof gridMix.renewable_kwh === 'number' && typeof gridMix.non_renewable_kwh === 'number') {
        totalRenewable += gridMix.renewable_kwh;
        totalNonRenewable += gridMix.non_renewable_kwh;
        withGridMix++;
      } else {
        withoutGridMix++;
      }
    });

    console.log(`With grid_mix: ${withGridMix}`);
    console.log(`Without grid_mix: ${withoutGridMix}`);

    if (withGridMix > 0) {
      const total = totalRenewable + totalNonRenewable;
      const percentage = total > 0 ? (totalRenewable / total * 100) : 0;

      console.log(`\nRenewable kWh: ${totalRenewable.toFixed(2)}`);
      console.log(`Non-Renewable kWh: ${totalNonRenewable.toFixed(2)}`);
      console.log(`Total Grid: ${total.toFixed(2)}`);
      console.log(`Renewable %: ${percentage.toFixed(1)}%`);
    }

    console.log('');
  }

  console.log('='.repeat(80));
}

checkSiteSpecificGridMix();
