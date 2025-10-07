import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getHistoricalPowerBreakdown,
  getHistoricalCarbonIntensity,
  convertToEnergyMix,
  getZoneFromCountryCode
} from '@/lib/external/electricity-maps';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for API call

/**
 * POST /api/energy/auto-populate-mix
 *
 * Automatically populate grid mix metadata for a new energy record
 * Called by database webhook when new record is inserted
 *
 * Body:
 * {
 *   "record": {
 *     "id": "uuid",
 *     "metric_id": "uuid",
 *     "value": 1000,
 *     "period_start": "2024-01-01",
 *     "site_id": "uuid",
 *     "metadata": {}
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = body.record || body;

    if (!record.id || !record.metric_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already has grid mix
    if (record.metadata?.grid_mix?.sources?.length > 0) {
      return NextResponse.json({
        skipped: true,
        reason: 'Already has grid mix data'
      });
    }

    // Get metric info
    const { data: metric, error: metricError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('code, energy_type')
      .eq('id', record.metric_id)
      .single();

    if (metricError || !metric) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      );
    }

    // Only process electricity
    if (metric.energy_type !== 'electricity') {
      return NextResponse.json({
        skipped: true,
        reason: 'Not electricity metric'
      });
    }

    // Get country from site
    let countryCode = 'PT'; // Default
    if (record.site_id) {
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select('country_code')
        .eq('id', record.site_id)
        .single();

      if (site?.country_code) {
        countryCode = site.country_code;
      }
    }

    // Skip future dates
    const date = new Date(record.period_start);
    if (date > new Date()) {
      return NextResponse.json({
        skipped: true,
        reason: 'Future date'
      });
    }

    // Fetch grid mix from Electricity Maps
    const zone = getZoneFromCountryCode(countryCode);
    const breakdown = await getHistoricalPowerBreakdown(zone, date.toISOString());

    if (!breakdown || !breakdown.renewablePercentage) {
      return NextResponse.json({
        skipped: true,
        reason: 'No grid mix data available from API'
      });
    }

    // Fetch carbon intensity
    const carbonData = await getHistoricalCarbonIntensity(zone, date.toISOString());

    // Convert to energy mix
    const energyMix = convertToEnergyMix(breakdown);

    // Calculate renewable/non-renewable kWh
    const totalKwh = parseFloat(record.value) || 0;
    const renewableKwh = totalKwh * (energyMix.renewable_percentage / 100);
    const nonRenewableKwh = totalKwh * (energyMix.non_renewable_percentage / 100);

    // Calculate emissions using carbon intensity (gCO2eq/kWh)
    let emissionFactorLifecycle = null;
    let emissionFactorScope2 = null;
    let emissionFactorScope3 = null;
    let calculatedEmissionsTotal = null;
    let calculatedEmissionsScope2 = null;
    let calculatedEmissionsScope3 = null;

    if (carbonData && carbonData.carbonIntensity) {
      emissionFactorLifecycle = carbonData.carbonIntensity; // gCO2eq/kWh (total)

      // Electricity Maps lifecycle factor includes both Scope 2 and Scope 3
      // According to literature, Scope 3 upstream is typically 10-20% of lifecycle
      // For Portugal's mix, we estimate Scope 3 as 15% of total lifecycle
      // This is a conservative estimate; actual split varies by source
      emissionFactorScope3 = emissionFactorLifecycle * 0.15; // Upstream (15%)
      emissionFactorScope2 = emissionFactorLifecycle * 0.85; // Direct (85%)

      calculatedEmissionsTotal = (totalKwh * emissionFactorLifecycle) / 1000; // kgCO2e
      calculatedEmissionsScope2 = (totalKwh * emissionFactorScope2) / 1000; // kgCO2e
      calculatedEmissionsScope3 = (totalKwh * emissionFactorScope3) / 1000; // kgCO2e
    }

    // Update metadata with grid mix AND emission factors (Scope 2 + Scope 3)
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

        // Emission factors (gCO2eq/kWh)
        carbon_intensity_lifecycle: emissionFactorLifecycle, // Total (Scope 2 + 3)
        carbon_intensity_scope2: emissionFactorScope2, // Direct emissions at plant
        carbon_intensity_scope3_cat3: emissionFactorScope3, // Upstream (fuel extraction, transport)

        // Calculated emissions (kgCO2e)
        calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
        calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
        calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3,

        emission_factor_type: carbonData?.emissionFactorType || null,
        source: 'electricity_maps_api',
        updated_at: new Date().toISOString()
      }
    };

    // Update record
    const { error: updateError } = await supabaseAdmin
      .from('metrics_data')
      .update({ metadata: newMetadata })
      .eq('id', record.id);

    if (updateError) {
      console.error('Error updating record:', updateError);
      return NextResponse.json(
        { error: 'Failed to update record', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      renewable_percentage: energyMix.renewable_percentage,
      sources_count: energyMix.sources.length,
      carbon_intensity_lifecycle: emissionFactorLifecycle,
      carbon_intensity_scope2: emissionFactorScope2,
      carbon_intensity_scope3_cat3: emissionFactorScope3,
      calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
      calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
      calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3
    });

  } catch (error) {
    console.error('Error in auto-populate-mix:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
