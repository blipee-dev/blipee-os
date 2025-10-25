import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function debug2025Emissions() {
  console.log('Checking 2025 emissions calculation\n');

  // Get all 2025 records with pagination
  let allRecords: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
      .gte('period_start', '2025-01-01')
      .lt('period_start', '2026-01-01')
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    allRecords = allRecords.concat(batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  console.log(`📊 Found ${allRecords.length} records for 2025`);

  // Group by month
  const monthlyData: { [key: string]: { count: number, total: number } } = {};

  allRecords.forEach(r => {
    const month = r.period_start?.substring(0, 7);
    if (month) {
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, total: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].total += (r.co2e_emissions || 0);
    }
  });

  console.log('\n📅 Monthly breakdown:');
  Object.entries(monthlyData).sort().forEach(([month, data]) => {
    console.log(`  ${month}: ${data.count} records, ${data.total.toFixed(2)} kg (${(data.total / 1000).toFixed(2)} t)`);
  });

  const totalKg = allRecords.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const totalTonnes = totalKg / 1000;

  console.log('\n📊 2025 Totals:');
  console.log(`  Raw sum (kgCO2e): ${totalKg.toFixed(2)}`);
  console.log(`  Converted (tCO2e): ${totalTonnes.toFixed(2)}`);
  console.log(`  Unique months: ${Object.keys(monthlyData).length}`);

  if (totalKg > 500000) {
    console.log('\n⚠️  WARNING: The raw value is very large!');
    console.log(`   If displaying as "${totalKg.toLocaleString()}" it needs /1000 conversion`);
    console.log(`   Should display as: "${totalTonnes.toLocaleString()} tCO2e"`);
  }
}

debug2025Emissions();
