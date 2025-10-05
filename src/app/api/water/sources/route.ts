import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;

    // Get current period (default to current month)
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Fetch water usage data
    const { data: waterData, error: waterError } = await supabase
      .from('water_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`);

    if (waterError) {
      throw waterError;
    }

    if (!waterData || waterData.length === 0) {
      return NextResponse.json({
        sources: [],
        total_withdrawal: 0,
        total_consumption: 0,
        total_discharge: 0,
        total_recycled: 0,
        total_cost: 0,
        recycling_rate: 0
      });
    }

    // Group by water source
    const sourceMap = new Map();

    waterData.forEach((record) => {
      const source = record.water_source;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          name: source,
          withdrawal: 0,
          consumption: 0,
          discharge: 0,
          recycled: record.is_recycled ? record.volume_liters : 0,
          cost: 0 // Would need a cost field in the table
        });
      }

      const sourceData = sourceMap.get(source);
      const volumeM3 = record.volume_liters / 1000; // Convert to cubic meters

      sourceData.withdrawal += volumeM3;
      sourceData.consumption += volumeM3;
      if (record.is_recycled) {
        sourceData.recycled += volumeM3;
      }
    });

    const sources = Array.from(sourceMap.values());

    const totals = {
      total_withdrawal: sources.reduce((sum, s) => sum + s.withdrawal, 0),
      total_consumption: sources.reduce((sum, s) => sum + s.consumption, 0),
      total_discharge: sources.reduce((sum, s) => sum + s.discharge, 0),
      total_recycled: sources.reduce((sum, s) => sum + s.recycled, 0),
      total_cost: sources.reduce((sum, s) => sum + s.cost, 0)
    };

    const recyclingRate = totals.total_consumption > 0
      ? (totals.total_recycled / totals.total_consumption * 100)
      : 0;

    return NextResponse.json({
      sources,
      ...totals,
      recycling_rate: Math.round(recyclingRate * 10) / 10
    });

  } catch (error) {
    console.error('Error fetching water sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water sources' },
      { status: 500 }
    );
  }
}
