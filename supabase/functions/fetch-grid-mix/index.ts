// Supabase Edge Function: Fetch Grid Mix
// Called by database trigger when new energy record is inserted

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ELECTRICITY_MAPS_API_KEY = Deno.env.get('ELECTRICITY_MAPS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GridMixRequest {
  record_id: string;
  metric_id: string;
  value: number;
  period_start: string;
  site_id?: string;
}

serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { record_id, metric_id, value, period_start, site_id }: GridMixRequest = await req.json();

    if (!ELECTRICITY_MAPS_API_KEY) {
      console.error('Electricity Maps API key not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get metric info
    const { data: metric } = await supabase
      .from('metrics_catalog')
      .select('code, energy_type')
      .eq('id', metric_id)
      .single();

    // Only process electricity
    if (!metric || metric.energy_type !== 'electricity') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not electricity' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get country from site
    let countryCode = 'PT'; // Default
    if (site_id) {
      const { data: site } = await supabase
        .from('sites')
        .select('country_code')
        .eq('id', site_id)
        .single();

      if (site?.country_code) {
        countryCode = site.country_code;
      }
    }

    // Skip future dates
    const date = new Date(period_start);
    if (date > new Date()) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Future date' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch from Electricity Maps
    const response = await fetch(
      `https://api.electricitymap.org/v3/power-breakdown/history?zone=${countryCode}&datetime=${date.toISOString()}`,
      {
        headers: { 'auth-token': ELECTRICITY_MAPS_API_KEY }
      }
    );

    if (!response.ok) {
      console.error('Electricity Maps API error:', response.status);
      return new Response(JSON.stringify({ error: 'API request failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const breakdown = data.history?.[0];

    if (!breakdown || !breakdown.renewablePercentage) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No data available' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert to energy mix
    const consumption = breakdown.powerConsumptionBreakdown || {};
    const total = breakdown.powerConsumptionTotal || 0;

    const sourceMapping: { [key: string]: { name: string; renewable: boolean } } = {
      'solar': { name: 'Solar', renewable: true },
      'wind': { name: 'Wind', renewable: true },
      'hydro': { name: 'Hydro', renewable: true },
      'hydro discharge': { name: 'Hydro Storage', renewable: true },
      'biomass': { name: 'Biomass', renewable: true },
      'geothermal': { name: 'Geothermal', renewable: true },
      'nuclear': { name: 'Nuclear', renewable: false },
      'gas': { name: 'Natural Gas', renewable: false },
      'coal': { name: 'Coal', renewable: false },
      'oil': { name: 'Oil', renewable: false },
      'unknown': { name: 'Unknown', renewable: false },
      'battery discharge': { name: 'Battery', renewable: true }
    };

    const sources = Object.entries(consumption)
      .filter(([_, v]) => v !== null && (v as number) > 0)
      .map(([source, val]) => {
        const config = sourceMapping[source] || { name: source, renewable: false };
        const percentage = ((val as number) / total) * 100;
        return {
          name: config.name,
          percentage: Math.round(percentage * 100) / 100,
          renewable: config.renewable
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const renewablePercentage = Math.round(breakdown.renewablePercentage * 100) / 100;
    const nonRenewablePercentage = Math.round((100 - renewablePercentage) * 100) / 100;
    const totalKwh = parseFloat(value.toString()) || 0;
    const renewableKwh = totalKwh * (renewablePercentage / 100);
    const nonRenewableKwh = totalKwh * (nonRenewablePercentage / 100);

    // Get existing metadata
    const { data: existingRecord } = await supabase
      .from('metrics_data')
      .select('metadata')
      .eq('id', record_id)
      .single();

    // Update metadata with grid mix
    const newMetadata = {
      ...(existingRecord?.metadata || {}),
      grid_mix: {
        provider: 'Electricity Maps',
        zone: breakdown.zone,
        datetime: breakdown.datetime,
        country: countryCode,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        renewable_percentage: renewablePercentage,
        non_renewable_percentage: nonRenewablePercentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: nonRenewableKwh,
        sources,
        source: 'electricity_maps_api',
        updated_at: new Date().toISOString()
      }
    };

    // Update record
    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({ metadata: newMetadata })
      .eq('id', record_id);

    if (updateError) {
      console.error('Error updating record:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      renewable_percentage: renewablePercentage,
      sources_count: sources.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
