import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/devices/data - Get device data with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const deviceId = searchParams.get('device_id');
    const variable = searchParams.get('variable');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = searchParams.get('limit') || '1000';

    if (!deviceId) {
      return NextResponse.json({ error: 'device_id is required' }, { status: 400 });
    }

    let query = supabase
      .from('device_data')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (variable) query = query.eq('variable', variable);
    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching device data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/devices/data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/devices/data - Insert device data (single or batch)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Support both single and batch insertion
    const dataToInsert = Array.isArray(body) ? body : [body];

    // Validate and format data
    const formattedData = dataToInsert.map(item => ({
      device_id: item.device_id,
      timestamp: item.timestamp || new Date().toISOString(),
      variable: item.variable,
      value: parseFloat(item.value),
      unit: item.unit,
      metadata: item.metadata || {},
    }));

    const { data, error } = await supabase
      .from('device_data')
      .insert(formattedData)
      .select();

    if (error) {
      console.error('Error inserting device data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update device last_seen_at
    const deviceIds = [...new Set(formattedData.map(d => d.device_id))];
    await supabase
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .in('id', deviceIds);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/devices/data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/devices/data - Delete device data (for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const deviceId = searchParams.get('device_id');
    const beforeDate = searchParams.get('before_date');

    if (!deviceId || !beforeDate) {
      return NextResponse.json({
        error: 'device_id and before_date are required'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('device_data')
      .delete()
      .eq('device_id', deviceId)
      .lt('timestamp', beforeDate);

    if (error) {
      console.error('Error deleting device data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/devices/data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}