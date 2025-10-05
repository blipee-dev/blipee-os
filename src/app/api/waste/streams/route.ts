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

    // Get current period
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Fetch waste data
    const { data: wasteData, error: wasteError } = await supabase
      .from('waste_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`);

    if (wasteError) {
      throw wasteError;
    }

    if (!wasteData || wasteData.length === 0) {
      return NextResponse.json({
        streams: [],
        total_generated: 0,
        total_diverted: 0,
        total_landfill: 0,
        diversion_rate: 0,
        recycling_rate: 0
      });
    }

    // Group by waste type and disposal method
    const streamMap = new Map();

    wasteData.forEach((record) => {
      const key = `${record.waste_type}-${record.disposal_method}`;
      if (!streamMap.has(key)) {
        streamMap.set(key, {
          type: record.waste_type,
          disposal_method: record.disposal_method,
          quantity: 0,
          unit: record.unit,
          diverted: record.diverted_from_landfill || false,
          recycling_rate: record.recycling_rate || 0
        });
      }

      const stream = streamMap.get(key);
      stream.quantity += record.quantity || 0;
    });

    const streams = Array.from(streamMap.values());

    const totalGenerated = streams.reduce((sum, s) => sum + s.quantity, 0);
    const totalDiverted = streams
      .filter(s => s.diverted)
      .reduce((sum, s) => sum + s.quantity, 0);
    const totalLandfill = totalGenerated - totalDiverted;

    const diversionRate = totalGenerated > 0
      ? (totalDiverted / totalGenerated * 100)
      : 0;

    const avgRecyclingRate = streams.length > 0
      ? streams.reduce((sum, s) => sum + (s.recycling_rate || 0), 0) / streams.length
      : 0;

    return NextResponse.json({
      streams,
      total_generated: Math.round(totalGenerated * 100) / 100,
      total_diverted: Math.round(totalDiverted * 100) / 100,
      total_landfill: Math.round(totalLandfill * 100) / 100,
      diversion_rate: Math.round(diversionRate * 10) / 10,
      recycling_rate: Math.round(avgRecyclingRate * 10) / 10
    });

  } catch (error) {
    console.error('Error fetching waste streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste streams' },
      { status: 500 }
    );
  }
}
