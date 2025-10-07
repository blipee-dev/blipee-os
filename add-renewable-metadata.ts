import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// EDP Portugal renewable percentages by year and month
// Format: 'YYYY-MM' for monthly data, or just YYYY for annual average applied to all months
const EDP_RENEWABLE_PERCENTAGE: { [key: string]: number } = {
  // 2022 - Annual average applied to all months
  '2022': 28.15,

  // 2023 - Annual average applied to all months
  '2023': 33.30,

  // 2024 - Annual average applied to all months
  '2024': 62.23,

  // 2025 - Annual average applied to all months
  '2025': 56.99,

  // Example of monthly data (when available):
  // '2024-01': 58.5,
  // '2024-02': 61.2,
  // '2024-03': 63.8,
  // etc...
};

/**
 * Get renewable percentage for a specific date
 * Tries monthly data first, falls back to annual average
 */
function getRenewablePercentage(date: Date): number | null {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 01-12
  const yearMonth = `${year}-${month}`;

  // Try monthly data first
  if (EDP_RENEWABLE_PERCENTAGE[yearMonth] !== undefined) {
    return EDP_RENEWABLE_PERCENTAGE[yearMonth];
  }

  // Fall back to annual average
  if (EDP_RENEWABLE_PERCENTAGE[year.toString()] !== undefined) {
    return EDP_RENEWABLE_PERCENTAGE[year.toString()];
  }

  return null;
}

async function addRenewableMetadata() {
  console.log('\n🔧 Adding renewable percentage metadata to electricity metrics...\n');

  try {
    // 1. Get all electricity-related metrics from the catalog
    const { data: electricityMetrics, error: catalogError } = await supabase
      .from('metrics_catalog')
      .select('id, code, name')
      .or('code.ilike.%electricity%,code.ilike.%grid%,code.ilike.%ev%');

    if (catalogError) {
      console.error('❌ Error fetching electricity metrics:', catalogError);
      return;
    }

    console.log(`📊 Found ${electricityMetrics?.length || 0} electricity metrics in catalog:`);
    electricityMetrics?.forEach(m => console.log(`  - ${m.code}: ${m.name}`));

    if (!electricityMetrics || electricityMetrics.length === 0) {
      console.log('⚠️  No electricity metrics found');
      return;
    }

    const metricIds = electricityMetrics.map(m => m.id);

    // 2. Get all electricity data records
    const { data: electricityData, error: dataError } = await supabase
      .from('metrics_data')
      .select('id, period_start, value, metadata, metric_id')
      .in('metric_id', metricIds);

    if (dataError) {
      console.error('❌ Error fetching electricity data:', dataError);
      return;
    }

    console.log(`\n📊 Found ${electricityData?.length || 0} electricity data records\n`);

    if (!electricityData || electricityData.length === 0) {
      console.log('⚠️  No electricity data found');
      return;
    }

    // 3. Update each record with renewable percentage metadata
    let updated = 0;
    let skipped = 0;

    for (const record of electricityData) {
      const periodDate = new Date(record.period_start);
      const year = periodDate.getFullYear();
      const month = String(periodDate.getMonth() + 1).padStart(2, '0');
      const renewablePercentage = getRenewablePercentage(periodDate);

      if (renewablePercentage === null) {
        console.log(`⚠️  No renewable data for ${year}-${month}, skipping record ${record.id}`);
        skipped++;
        continue;
      }

      // Calculate renewable and non-renewable portions
      const totalKWh = parseFloat(record.value as string);
      const renewableKWh = totalKWh * (renewablePercentage / 100);
      const nonRenewableKWh = totalKWh * ((100 - renewablePercentage) / 100);

      // Update metadata
      const newMetadata = {
        ...(record.metadata || {}),
        grid_mix: {
          provider: 'EDP',
          country: 'PT',
          year: year,
          month: parseInt(month),
          period: `${year}-${month}`,
          renewable_percentage: renewablePercentage,
          non_renewable_percentage: 100 - renewablePercentage,
          renewable_kwh: renewableKWh,
          non_renewable_kwh: nonRenewableKWh,
          source: 'https://www.edp.com',
          updated_at: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('metrics_data')
        .update({ metadata: newMetadata })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError);
      } else {
        updated++;
        if (updated % 10 === 0) {
          console.log(`✅ Updated ${updated} records...`);
        }
      }
    }

    console.log(`\n✅ Metadata update complete!`);
    console.log(`   Updated: ${updated} records`);
    console.log(`   Skipped: ${skipped} records`);

    // 4. Verify the updates
    console.log('\n📊 Sample updated records:\n');
    const { data: sample } = await supabase
      .from('metrics_data')
      .select('period_start, value, metadata')
      .in('metric_id', metricIds)
      .not('metadata->grid_mix', 'is', null)
      .limit(5);

    if (sample) {
      sample.forEach(s => {
        const gridMix = (s.metadata as any)?.grid_mix;
        console.log(`${gridMix?.period}: ${s.value} kWh total`);
        console.log(`  └─ ${gridMix?.renewable_percentage}% renewable (${gridMix?.renewable_kwh?.toFixed(2)} kWh)`);
        console.log(`  └─ ${gridMix?.non_renewable_percentage}% non-renewable (${gridMix?.non_renewable_kwh?.toFixed(2)} kWh)\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addRenewableMetadata().catch(console.error);
