import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getEnergyTotal } from '@/lib/sustainability/baseline-calculator';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // ✅ USE CALCULATOR for energy totals (consistent with other APIs)
    console.log('✅ Using calculator for energy baseline...');

    // Get 2024 data for annual baseline
    const startOf2024 = '2024-01-01';
    const endOf2024 = '2024-12-31';

    // Use calculator to get total energy
    const totalEnergyKWh = await getEnergyTotal(memberData.organization_id, startOf2024, endOf2024);

    console.log('✅ Calculator energy total:', totalEnergyKWh, 'kWh');

    // Still fetch detailed breakdown for categorization (heating, cooling, EV, etc.)
    // This is additional detail not in calculator yet
    const { data: energyMetrics } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        value,
        unit,
        period_start,
        period_end,
        metrics_catalog (
          name,
          category,
          subcategory,
          unit
        )
      `)
      .eq('organization_id', memberData.organization_id)
      .not('value', 'is', null)
      .gt('value', 0)
      .gte('period_start', startOf2024)
      .lte('period_end', endOf2024);

    // Categorize energy types for detailed breakdown
    let totalRenewableKWh = 0;
    let electricityKWh = 0;
    let heatingKWh = 0;
    let coolingKWh = 0;
    let evChargingKWh = 0;
    let gasUnits = 0;

    energyMetrics?.forEach(metric => {
      const category = metric.metrics_catalog?.category?.toLowerCase() || '';
      const name = metric.metrics_catalog?.name?.toLowerCase() || '';
      const subcategory = metric.metrics_catalog?.subcategory?.toLowerCase() || '';
      const unit = metric.unit || metric.metrics_catalog?.unit || '';
      const value = metric.value || 0;

      // Convert to kWh based on unit
      let valueInKWh = 0;
      if (unit === 'MWh') {
        valueInKWh = value * 1000;
      } else if (unit === 'kWh') {
        valueInKWh = value;
      } else if (unit === 'GJ') {
        valueInKWh = value * 277.778;
      }

      // Categorize energy types
      if (name.includes('electricity') || category.includes('electricity')) {
        if (name.includes('ev') || subcategory.includes('ev')) {
          evChargingKWh += valueInKWh;
        } else {
          electricityKWh += valueInKWh;
        }
      } else if (name.includes('heating') || name.includes('heat')) {
        heatingKWh += valueInKWh;
      } else if (name.includes('cooling') || name.includes('cool')) {
        coolingKWh += valueInKWh;
      }

      // Track renewable energy separately
      if (name.includes('renewable') || name.includes('solar') || name.includes('wind')) {
        totalRenewableKWh += valueInKWh;
      }

      // Natural gas metrics
      if (name.includes('gas') || name.includes('natural gas')) {
        if (unit === 'm³' || unit === 'm3') {
          gasUnits += value;
        } else if (unit === 'kWh') {
          gasUnits += value / 10.55; // Approximate conversion
        }
      }
    });

    // Calculate renewable percentage
    const renewablePercentage = totalEnergyKWh > 0
      ? Math.round((totalRenewableKWh / totalEnergyKWh) * 100)
      : 0;

    return NextResponse.json({
      totalEnergy: Math.round(totalEnergyKWh), // From calculator
      electricity: Math.round(electricityKWh),
      heating: Math.round(heatingKWh),
      cooling: Math.round(coolingKWh),
      evCharging: Math.round(evChargingKWh),
      renewable: Math.round(totalRenewableKWh),
      renewablePercentage,
      gas: Math.round(gasUnits),
      unit: 'kWh',
      breakdown: {
        electricity: electricityKWh > 0 ? `${Math.round(electricityKWh).toLocaleString()} kWh` : 'No data',
        heating: heatingKWh > 0 ? `${Math.round(heatingKWh).toLocaleString()} kWh` : 'No heating data',
        cooling: coolingKWh > 0 ? `${Math.round(coolingKWh).toLocaleString()} kWh` : 'No cooling data',
        evCharging: evChargingKWh > 0 ? `${Math.round(evChargingKWh).toLocaleString()} kWh` : 'No EV charging data',
        renewable: totalRenewableKWh > 0 ? `${Math.round(totalRenewableKWh).toLocaleString()} kWh (${renewablePercentage}%)` : 'No renewable energy data',
        gas: gasUnits > 0 ? `${Math.round(gasUnits).toLocaleString()} m³` : 'No gas data'
      }
    });

  } catch (error) {
    console.error('Error in energy baseline API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}