import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllSites2025() {
  console.log('🏢 Checking waste data by SITE for 2025...\n');

  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  const { data: wasteData } = await supabase
    .from('metrics_data')
    .select('*, site:sites(name)')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31');

  // Group by site
  const bySite: any = {};

  wasteData?.forEach((record: any) => {
    const siteName = record.site?.name || 'Unknown';
    const siteId = record.site_id;
    const key = `${siteId}`;

    if (!bySite[key]) {
      bySite[key] = {
        site_id: siteId,
        site_name: siteName,
        total: 0,
        count: 0,
        records: []
      };
    }

    const value = parseFloat(record.value) || 0;
    bySite[key].total += value;
    bySite[key].count++;
    bySite[key].records.push({
      metric_id: record.metric_id,
      value: value,
      period: record.period_start
    });
  });

  console.log('📊 2025 Waste by Site:\n');
  Object.values(bySite).forEach((site: any) => {
    console.log(`${site.site_name} (${site.site_id})`);
    console.log(`  Total: ${site.total.toFixed(2)} tons`);
    console.log(`  Records: ${site.count}\n`);
  });

  const grandTotal = Object.values(bySite).reduce((sum: number, s: any) => sum + s.total, 0);
  console.log(`\n🌍 GRAND TOTAL (All Sites): ${grandTotal.toFixed(2)} tons`);
  console.log(`📊 Dashboard shows: 851.9 tons`);
  console.log(`❓ Difference: ${(851.9 - grandTotal).toFixed(2)} tons\n`);

  if (Math.abs(851.9 - grandTotal) < 1) {
    console.log('✅ MATCH! The 851.9 is the sum of all sites');
  } else {
    console.log('❌ NO MATCH - investigating...');
  }
}

checkAllSites2025();
