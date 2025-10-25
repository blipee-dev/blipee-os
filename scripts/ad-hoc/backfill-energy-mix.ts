/**
 * Backfill energy mix metadata for existing energy records
 *
 * This script:
 * 1. Queries all energy records from metrics_data
 * 2. For each record, fetches grid mix from Electricity Maps API
 * 3. Updates the record's metadata with grid_mix data
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  getHistoricalPowerBreakdown,
  convertToEnergyMix,
  getZoneFromCountryCode
} from './src/lib/external/electricity-maps';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillEnergyMix() {
  console.log('🔄 Starting energy mix backfill...\n');

  // Get all energy metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, energy_type')
    .in('category', ['Purchased Energy', 'Electricity']);

  if (metricsError) {
    console.error('❌ Error fetching metrics:', metricsError);
    return;
  }

  console.log(`📊 Found ${metrics.length} energy metrics\n`);

  // Get recent energy records that don't have grid_mix metadata yet (limit to 20 for testing)
  const { data: records, error: recordsError} = await supabase
    .from('metrics_data')
    .select('id, metric_id, value, period_start, metadata, site_id')
    .in('metric_id', metrics.map(m => m.id))
    .order('period_start', { ascending: false })
    .limit(20); // Start with just 20 records for testing

  if (recordsError) {
    console.error('❌ Error fetching records:', recordsError);
    return;
  }

  console.log(`📝 Found ${records.length} energy records\n`);

  // Get site info for country code
  const siteIds = [...new Set(records.map(r => r.site_id).filter(Boolean))];
  const { data: sites } = await supabase
    .from('sites')
    .select('id, country_code')
    .in('id', siteIds);

  const siteCountryMap = new Map(sites?.map(s => [s.id, s.country_code]) || []);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of records) {
    const metric = metrics.find(m => m.id === record.metric_id);
    if (!metric) continue;

    // Skip if already has grid_mix with sources
    if (record.metadata?.grid_mix?.sources && record.metadata.grid_mix.sources.length > 0) {
      skipped++;
      continue;
    }

    // Only process electricity for now (district heating/cooling don't have grid mix)
    if (metric.energy_type !== 'electricity') {
      skipped++;
      continue;
    }

    // Get country code from site
    const countryCode = siteCountryMap.get(record.site_id) || 'PT';
    const zone = getZoneFromCountryCode(countryCode);

    // Get date from period_start
    const date = new Date(record.period_start);
    const datetime = date.toISOString();

    console.log(`Processing record ${record.id.substring(0, 8)}... (${metric.code}, ${datetime.substring(0, 10)})`);

    try {
      // Fetch grid mix from Electricity Maps
      const breakdown = await getHistoricalPowerBreakdown(zone, datetime);

      if (!breakdown) {
        console.log(`  ⚠️  No data from Electricity Maps`);
        failed++;
        continue;
      }

      // Convert to our format
      const energyMix = convertToEnergyMix(breakdown);

      // Calculate renewable/non-renewable kWh
      const totalKwh = parseFloat(record.value) || 0;
      const renewableKwh = totalKwh * (energyMix.renewable_percentage / 100);
      const nonRenewableKwh = totalKwh * (energyMix.non_renewable_percentage / 100);

      // Update metadata
      const newMetadata = {
        ...(record.metadata || {}),
        grid_mix: {
          provider: 'Electricity Maps',
          zone: breakdown.zone,
          datetime: breakdown.datetime,
          country: countryCode,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          renewable_percentage: energyMix.renewable_percentage,
          non_renewable_percentage: energyMix.non_renewable_percentage,
          renewable_kwh: renewableKwh,
          non_renewable_kwh: nonRenewableKwh,
          sources: energyMix.sources,
          source: 'electricity_maps_api',
          updated_at: new Date().toISOString()
        }
      };

      // Update record
      const { error: updateError } = await supabase
        .from('metrics_data')
        .update({ metadata: newMetadata })
        .eq('id', record.id);

      if (updateError) {
        console.log(`  ❌ Error updating: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Updated (${energyMix.renewable_percentage}% renewable)`);
        updated++;
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
      failed++;
    }
  }

  console.log('\n📊 Backfill Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${records.length}`);

  console.log('\n✅ Done!');
}

backfillEnergyMix();
