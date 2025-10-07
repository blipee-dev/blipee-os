import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    // Get energy metrics from metrics_catalog
    const { data: energyMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity']);

    if (metricsError) {
      console.error('Error fetching energy metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch energy metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!energyMetrics || energyMetrics.length === 0) {
      return NextResponse.json({
        sources: [],
        total_consumption: 0,
        total_emissions: 0,
        total_cost: 0,
        renewable_percentage: 0
      });
    }

    // Get energy data from metrics_data (using admin to bypass RLS)
    const metricIds = energyMetrics.map(m => m.id);
    let query = supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('period_start', startDate);
    }
    if (endDate) {
      query = query.lte('period_start', endDate);
    }

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: energyData, error: dataError } = await query.order('period_start', { ascending: false });

    if (dataError) {
      console.error('Error fetching energy data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch energy data', details: dataError.message },
        { status: 500 }
      );
    }

    if (!energyData || energyData.length === 0) {
      return NextResponse.json({
        sources: [],
        total_consumption: 0,
        total_emissions: 0,
        total_cost: 0,
        renewable_percentage: 0
      });
    }

    // Group by source type and aggregate
    const sourcesByType = (energyData || []).reduce((acc: any, record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';

      // Map metric codes to display names
      const typeMapping: { [key: string]: { name: string, type: string } } = {
        'scope2_electricity_grid': { name: 'Grid Electricity', type: 'grid_electricity' },
        'scope2_electricity_renewable': { name: 'Renewable Electricity', type: 'renewable_electricity' },
        'scope2_electricity_solar': { name: 'Solar Power', type: 'solar' },
        'scope2_electricity_wind': { name: 'Wind Power', type: 'wind' },
        'scope2_ev_charging': { name: 'EV Charging', type: 'ev_charging' },
        'scope2_purchased_heating': { name: 'Purchased Heating', type: 'purchased_heating' },
        'scope2_purchased_cooling': { name: 'Purchased Cooling', type: 'purchased_cooling' },
        'scope2_purchased_steam': { name: 'Steam', type: 'steam' },
        'scope2_district_heating': { name: 'District Heating', type: 'district_heating' },
        'scope2_district_cooling': { name: 'District Cooling', type: 'district_cooling' },
      };

      const sourceInfo = typeMapping[metricCode] || { name: metric?.name || 'Other', type: 'other' };

      // Use the is_renewable flag from the database instead of hardcoded values
      const isRenewable = metric?.is_renewable || false;

      if (!acc[sourceInfo.type]) {
        acc[sourceInfo.type] = {
          name: sourceInfo.name,
          type: sourceInfo.type,
          consumption: 0,
          unit: metric?.unit || 'kWh',
          emissions: 0,  // Will be in tCO2e
          cost: 0,
          renewable: isRenewable,
          trend: 0
        };
      }

      // Add consumption (already in correct unit: kWh)
      acc[sourceInfo.type].consumption += parseFloat(record.value) || 0;

      // Convert emissions from kgCO2e (database) to tCO2e (GRI 305 standard)
      acc[sourceInfo.type].emissions += (parseFloat(record.co2e_emissions) || 0) / 1000;

      // Add cost if available
      acc[sourceInfo.type].cost += parseFloat(record.cost) || 0;

      return acc;
    }, {});

    const sources = Object.values(sourcesByType);

    // Calculate totals
    const totalConsumption = sources.reduce((sum: number, s: any) => sum + s.consumption, 0);
    const totalEmissions = sources.reduce((sum: number, s: any) => sum + s.emissions, 0);
    const totalCost = sources.reduce((sum: number, s: any) => sum + s.cost, 0);

    // Calculate 100% renewable consumption (solar, wind, etc - NOT grid electricity)
    const pureRenewableConsumption = sources
      .filter((s: any) => s.renewable)
      .reduce((sum: number, s: any) => sum + s.consumption, 0);

    // Calculate energy type breakdown using the new energy_type column
    const typeBreakdown = (energyData || []).reduce((acc: any, record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const energyType = metric?.energy_type || 'electricity'; // Default to electricity

      if (!acc[energyType]) {
        acc[energyType] = {
          name: energyType.charAt(0).toUpperCase() + energyType.slice(1),
          type: energyType,
          value: 0
        };
      }

      acc[energyType].value += parseFloat(record.value) || 0;
      return acc;
    }, {});

    const energyTypes = Object.values(typeBreakdown);

    // Calculate energy mix for ALL energy types that have mix metadata
    // Group by energy type and collect mix data
    const energyMixesByType: { [key: string]: any } = {};

    (energyData || []).forEach((record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const energyType = metric?.energy_type || 'electricity';
      const metricCode = metric?.code || '';

      // Initialize energy type if not exists
      if (!energyMixesByType[energyType]) {
        energyMixesByType[energyType] = {
          energy_type: energyType,
          total_consumption: 0,
          renewable_kwh: 0,
          non_renewable_kwh: 0,
          data_points: 0,
          provider: null,
          year: null,
          sources_map: {}, // To aggregate sources
          // Emission factors aggregation
          emission_factors: {
            lifecycle_sum: 0,
            scope2_sum: 0,
            scope3_sum: 0,
            count: 0
          }
        };
      }

      const mixData = energyMixesByType[energyType];

      // Check for mix metadata (grid_mix, supplier_mix, etc.)
      const gridMix = record.metadata?.grid_mix;
      const supplierMix = record.metadata?.supplier_mix;
      const mixInfo = gridMix || supplierMix;

      if (mixInfo) {
        mixData.renewable_kwh += mixInfo.renewable_kwh || 0;
        mixData.non_renewable_kwh += mixInfo.non_renewable_kwh || 0;
        mixData.data_points++;

        // Set provider and year from first record with metadata
        if (!mixData.provider && mixInfo.provider) {
          mixData.provider = mixInfo.provider;
        }
        if (!mixData.year && mixInfo.year) {
          mixData.year = mixInfo.year;
        }

        // Aggregate emission factors (gCO2eq/kWh)
        if (mixInfo.carbon_intensity_lifecycle) {
          mixData.emission_factors.lifecycle_sum += mixInfo.carbon_intensity_lifecycle;
          mixData.emission_factors.count++;
        }
        if (mixInfo.carbon_intensity_scope2) {
          mixData.emission_factors.scope2_sum += mixInfo.carbon_intensity_scope2;
        }
        if (mixInfo.carbon_intensity_scope3_cat3) {
          mixData.emission_factors.scope3_sum += mixInfo.carbon_intensity_scope3_cat3;
        }

        // Aggregate sources breakdown if available
        if (mixInfo.sources && Array.isArray(mixInfo.sources)) {
          mixInfo.sources.forEach((source: any) => {
            if (!mixData.sources_map[source.name]) {
              mixData.sources_map[source.name] = {
                name: source.name,
                percentage: 0,
                renewable: source.renewable,
                total_kwh: 0,
                count: 0
              };
            }
            // Weighted average of percentages
            mixData.sources_map[source.name].percentage += source.percentage || 0;
            mixData.sources_map[source.name].count++;
          });
        }
      }

      mixData.total_consumption += parseFloat(record.value) || 0;
    });

    // Convert to energy_mixes array format
    const energyMixes = Object.values(energyMixesByType)
      .filter((mix: any) => mix.data_points > 0) // Only include types with mix data
      .map((mix: any) => {
        const totalEnergy = mix.renewable_kwh + mix.non_renewable_kwh;
        const renewablePercentage = totalEnergy > 0
          ? (mix.renewable_kwh / totalEnergy * 100)
          : 0;

        // Calculate averaged source breakdown
        const sources = Object.values(mix.sources_map).map((source: any) => ({
          name: source.name,
          percentage: source.count > 0 ? source.percentage / source.count : null,
          renewable: source.renewable
        }));

        // Check if any sources have unknown percentages
        const hasUnknownSources = sources.some((s: any) => s.percentage === null || s.percentage === undefined);

        // Calculate averaged emission factors (gCO2eq/kWh)
        const emissionFactors = mix.emission_factors.count > 0 ? {
          carbon_intensity_lifecycle: mix.emission_factors.lifecycle_sum / mix.emission_factors.count,
          carbon_intensity_scope2: mix.emission_factors.scope2_sum / mix.emission_factors.count,
          carbon_intensity_scope3_cat3: mix.emission_factors.scope3_sum / mix.emission_factors.count
        } : null;

        return {
          energy_type: mix.energy_type,
          provider_name: mix.provider,
          year: mix.year,
          sources: sources.length > 0 ? sources : [],
          renewable_percentage: renewablePercentage,
          has_unknown_sources: hasUnknownSources,
          emission_factors: emissionFactors
        };
      });

    // Legacy grid_mix for backward compatibility (electricity only)
    let totalRenewableFromGrid = 0;
    let totalNonRenewableFromGrid = 0;
    let gridMixDataPoints = 0;

    (energyData || []).forEach((record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';

      if (metricCode.includes('electricity') || metricCode.includes('ev')) {
        const gridMix = record.metadata?.grid_mix;
        if (gridMix) {
          totalRenewableFromGrid += gridMix.renewable_kwh || 0;
          totalNonRenewableFromGrid += gridMix.non_renewable_kwh || 0;
          gridMixDataPoints++;
        }
      }
    });

    const gridMixData = gridMixDataPoints > 0 ? {
      total_grid_electricity: totalRenewableFromGrid + totalNonRenewableFromGrid,
      renewable_kwh: totalRenewableFromGrid,
      non_renewable_kwh: totalNonRenewableFromGrid,
      renewable_percentage: totalRenewableFromGrid + totalNonRenewableFromGrid > 0
        ? (totalRenewableFromGrid / (totalRenewableFromGrid + totalNonRenewableFromGrid) * 100)
        : 0,
      provider: 'EDP',
      country: 'PT',
      year: new Date(startDate || '').getFullYear() || new Date().getFullYear(),
      sources: energyMixes.find((m: any) => m.energy_type === 'electricity')?.sources || [],
      has_unknown_sources: energyMixes.find((m: any) => m.energy_type === 'electricity')?.has_unknown_sources || false,
      data_points: gridMixDataPoints
    } : null;

    // Calculate accurate renewable percentage including grid mix
    // Total renewable = 100% renewable sources (solar, wind) + renewable portion of grid electricity
    const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid;
    const renewablePercentage = totalConsumption > 0
      ? (totalRenewableEnergy / totalConsumption * 100)
      : 0;

    console.log('🌱 Renewable Calculation:');
    console.log('  Date range:', startDate, 'to', endDate);
    console.log('  Pure renewable (solar/wind):', pureRenewableConsumption, 'kWh');
    console.log('  Grid renewable (from EDP):', totalRenewableFromGrid, 'kWh');
    console.log('  Grid non-renewable (from EDP):', totalNonRenewableFromGrid, 'kWh');
    console.log('  Total grid electricity:', totalRenewableFromGrid + totalNonRenewableFromGrid, 'kWh');
    console.log('  Total renewable:', totalRenewableEnergy, 'kWh');
    console.log('  Total consumption (all energy types):', totalConsumption, 'kWh');
    console.log('  Renewable %:', renewablePercentage.toFixed(2), '%');
    console.log('  Grid mix data points:', gridMixDataPoints);
    console.log('\n📊 Energy breakdown by type:');
    sources.forEach((s: any) => {
      console.log(`    ${s.name}: ${s.consumption.toFixed(0)} kWh (${s.renewable ? 'renewable' : 'non-renewable'})`);
    });

    // Calculate monthly trends with source breakdown
    const monthlyData = (energyData || []).reduce((acc: any, record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          renewable: 0,
          fossil: 0,
          total: 0,
          // Source breakdown
          sources: {}
        };
      }

      const consumption = parseFloat(record.value) || 0;
      const metricCode = metric?.code || '';

      // Map metric codes to display names (same as in sources)
      const typeMapping: { [key: string]: string } = {
        'scope2_electricity_grid': 'Grid Electricity',
        'scope2_electricity_renewable': 'Renewable Electricity',
        'scope2_electricity_solar': 'Solar Power',
        'scope2_electricity_wind': 'Wind Power',
        'scope2_ev_charging': 'EV Charging',
        'scope2_purchased_heating': 'Purchased Heating',
        'scope2_purchased_cooling': 'Purchased Cooling',
        'scope2_district_heating': 'District Heating',
        'scope2_district_cooling': 'District Cooling',
        'scope2_steam': 'Steam'
      };

      const sourceName = typeMapping[metricCode] || metric?.name || 'Unknown';

      // Add to source breakdown
      if (!acc[monthKey].sources[sourceName]) {
        acc[monthKey].sources[sourceName] = 0;
      }
      acc[monthKey].sources[sourceName] += consumption;

      // Check if metric is 100% renewable (solar, wind) or has grid mix data
      const gridMix = record.metadata?.grid_mix;
      if (gridMix) {
        // Use grid mix renewable/non-renewable split
        acc[monthKey].renewable += gridMix.renewable_kwh || 0;
        acc[monthKey].fossil += gridMix.non_renewable_kwh || 0;
        acc[monthKey].total += consumption;
      } else if (metric?.is_renewable) {
        // 100% renewable source (solar, wind)
        acc[monthKey].renewable += consumption;
        acc[monthKey].total += consumption;
      } else {
        // Non-renewable source (heating, cooling without grid mix)
        acc[monthKey].fossil += consumption;
        acc[monthKey].total += consumption;
      }

      return acc;
    }, {});

    // Convert to array and sort by month
    const monthlyTrends = Object.values(monthlyData)
      .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey));

    console.log('🔍 Energy API Debug:');
    console.log('  - Total energy records:', energyData?.length || 0);
    console.log('  - Monthly trends count:', monthlyTrends.length);
    console.log('  - Monthly trends sample:', monthlyTrends.slice(0, 3));
    console.log('  - Energy mixes found:', energyMixes.length);
    console.log('  - Energy mixes:', energyMixes);

    return NextResponse.json({
      sources,
      total_consumption: totalConsumption,
      total_emissions: totalEmissions,
      total_cost: totalCost,
      renewable_percentage: Math.round(renewablePercentage * 10) / 10,
      energy_types: energyTypes,
      monthly_trends: monthlyTrends,
      energy_mixes: energyMixes, // New multi-type energy mix array
      grid_mix: gridMixData // Legacy backward compatibility
    });

  } catch (error) {
    console.error('Error fetching energy sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy sources' },
      { status: 500 }
    );
  }
}
