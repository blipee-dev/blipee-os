import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loja = searchParams.get('loja');

    if (!loja) {
      return NextResponse.json(
        { error: 'Store (loja) parameter is required' },
        { status: 400 }
      );
    }

    // Get current occupancy from foot traffic data (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    // Get recent foot traffic data
    const { data: recentTraffic, error: trafficError } = await supabase
      .from('retail.foot_traffic_raw')
      .select('*')
      .eq('store_id', loja)
      .gte('start_time', oneHourAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(10);

    if (trafficError) {
      console.error('Error fetching traffic data:', trafficError);
    }

    // Get regional occupancy data
    const { data: regionalData, error: regionalError } = await supabase
      .from('retail.regional_people_counting_data')
      .select('*')
      .eq('store_id', loja)
      .gte('start_time', oneHourAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(5);

    if (regionalError) {
      console.error('Error fetching regional data:', regionalError);
    }

    // Calculate current occupancy and trends
    let currentOccupancy = 0;
    let entriesLastHour = 0;
    let exitsLastHour = 0;
    let trend = 'stable';

    if (recentTraffic && recentTraffic.length > 0) {
      // Sum up entries and exits from recent data
      entriesLastHour = recentTraffic.reduce((sum, record) => 
        sum + (record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0), 0
      );
      
      exitsLastHour = recentTraffic.reduce((sum, record) => 
        sum + (record.line4_out || 0), 0
      );

      // Estimate current occupancy (entries - exits)
      currentOccupancy = Math.max(0, entriesLastHour - exitsLastHour);

      // Determine trend based on recent vs older data
      if (recentTraffic.length >= 2) {
        const recentEntries = recentTraffic.slice(0, Math.ceil(recentTraffic.length / 2))
          .reduce((sum, record) => sum + (record.total_in || 0), 0);
        const olderEntries = recentTraffic.slice(Math.ceil(recentTraffic.length / 2))
          .reduce((sum, record) => sum + (record.total_in || 0), 0);
        
        if (recentEntries > olderEntries * 1.1) {
          trend = 'increasing';
        } else if (recentEntries < olderEntries * 0.9) {
          trend = 'decreasing';
        }
      }
    }

    // Calculate regional occupancy
    const regions: { [key: string]: number } = {};
    if (regionalData && regionalData.length > 0) {
      // Aggregate recent regional data
      const recentRegional = regionalData[0]; // Most recent record
      regions.region1 = recentRegional.region1 || 0;
      regions.region2 = recentRegional.region2 || 0;
      regions.region3 = recentRegional.region3 || 0;
      regions.region4 = recentRegional.region4 || 0;
      
      // Include additional regions if available
      if (recentRegional.region5) regions.region5 = recentRegional.region5;
      if (recentRegional.region6) regions.region6 = recentRegional.region6;
      if (recentRegional.region7) regions.region7 = recentRegional.region7;
      if (recentRegional.region8) regions.region8 = recentRegional.region8;
    }

    // If no real data available, return mock data for compatibility
    if (!recentTraffic || recentTraffic.length === 0) {
      const mockData = {
        loja,
        current_occupancy: Math.floor(Math.random() * 200) + 50,
        last_update: new Date().toISOString(),
        last_hour: {
          entries: Math.floor(Math.random() * 100) + 20,
          exits: Math.floor(Math.random() * 90) + 15,
        },
        trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        regions: {
          region1: Math.floor(Math.random() * 50) + 10,
          region2: Math.floor(Math.random() * 40) + 5,
          region3: Math.floor(Math.random() * 30) + 5,
          region4: Math.floor(Math.random() * 20) + 2,
        },
        data_source: 'mock'
      };

      return NextResponse.json({
        success: true,
        data: mockData,
      });
    }

    // Return real traffic data
    const trafficData = {
      loja,
      current_occupancy: currentOccupancy,
      last_update: recentTraffic[0].start_time,
      last_hour: {
        entries: entriesLastHour,
        exits: exitsLastHour,
      },
      trend,
      regions,
      sensor_count: recentTraffic.length,
      data_source: 'sensors'
    };

    return NextResponse.json({
      success: true,
      data: trafficData,
    });
  } catch (error) {
    console.error('Error fetching real-time traffic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time traffic', details: error.message },
      { status: 500 }
    );
  }
}