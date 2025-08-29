import { NextRequest, NextResponse } from 'next/server';

const generateMockTraffic = (loja: string) => {
  const currentOccupancy = Math.floor(Math.random() * 200) + 50;
  const entriesLastHour = Math.floor(Math.random() * 100) + 20;
  const exitsLastHour = Math.floor(Math.random() * 90) + 15;
  
  return {
    loja,
    current_occupancy: currentOccupancy,
    last_update: new Date().toISOString(),
    last_hour: {
      entries: entriesLastHour,
      exits: exitsLastHour,
    },
    trend: currentOccupancy > 100 ? 'increasing' : 'decreasing',
    regions: {
      region1: Math.floor(Math.random() * 50) + 10,
      region2: Math.floor(Math.random() * 40) + 5,
      region3: Math.floor(Math.random() * 30) + 5,
      region4: Math.floor(Math.random() * 20) + 2,
    },
  };
};

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loja = searchParams.get('loja');

    if (!loja) {
      return NextResponse.json(
        { _error: 'Store (loja) parameter is required' },
        { status: 400 }
      );
    }

    // Generate mock real-time traffic data
    const trafficData = generateMockTraffic(loja);

    return NextResponse.json({
      success: true,
      data: trafficData,
    });
  } catch (error) {
    return NextResponse.json(
      { _error: 'Failed to fetch real-time traffic' },
      { status: 500 }
    );
  }
}