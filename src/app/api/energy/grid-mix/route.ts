import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getLatestPowerBreakdown,
  getHistoricalPowerBreakdown,
  convertToEnergyMix,
  getZoneFromCountryCode
} from '@/lib/external/electricity-maps';

export const dynamic = 'force-dynamic';

/**
 * GET /api/energy/grid-mix
 *
 * Fetch grid mix data from Electricity Maps API
 *
 * Query params:
 * - country_code: ISO 3166-1 alpha-2 (e.g., PT, ES, DE) - required
 * - datetime: ISO 8601 datetime for historical data (optional, defaults to latest)
 *
 * Returns:
 * {
 *   zone: string,
 *   datetime: string,
 *   renewable_percentage: number,
 *   non_renewable_percentage: number,
 *   sources: Array<{name: string, percentage: number, renewable: boolean}>,
 *   carbon_intensity: number (gCO2eq/kWh),
 *   source: 'electricity_maps_api'
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country_code');
    const datetime = searchParams.get('datetime');

    if (!countryCode) {
      return NextResponse.json(
        { error: 'country_code is required' },
        { status: 400 }
      );
    }

    // Convert country code to zone
    const zone = getZoneFromCountryCode(countryCode);

    // Fetch power breakdown from Electricity Maps
    let breakdown;
    if (datetime) {
      // Historical data
      breakdown = await getHistoricalPowerBreakdown(zone, datetime);
    } else {
      // Latest data
      breakdown = await getLatestPowerBreakdown(zone);
    }

    if (!breakdown) {
      return NextResponse.json(
        { error: 'Failed to fetch grid mix data from Electricity Maps' },
        { status: 503 }
      );
    }

    // Convert to our format
    const energyMix = convertToEnergyMix(breakdown);

    return NextResponse.json({
      zone: breakdown.zone,
      datetime: breakdown.datetime,
      renewable_percentage: energyMix.renewable_percentage,
      non_renewable_percentage: energyMix.non_renewable_percentage,
      sources: energyMix.sources,
      fossil_free_percentage: breakdown.fossilFreePercentage,
      total_consumption: breakdown.powerConsumptionTotal,
      source: 'electricity_maps_api',
      updated_at: breakdown.updatedAt
    });

  } catch (error) {
    console.error('Error fetching grid mix:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid mix data' },
      { status: 500 }
    );
  }
}
