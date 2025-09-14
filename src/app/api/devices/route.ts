import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/devices - List devices with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const siteId = searchParams.get('site_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('devices')
      .select(`
        *,
        site:sites(id, name)
      `)
      .order('created_at', { ascending: false });

    if (siteId) query = query.eq('site_id', siteId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching devices:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('devices')
      .insert({
        site_id: body.site_id,
        external_id: body.external_id,
        name: body.name,
        type: body.type,
        manufacturer: body.manufacturer,
        model: body.model,
        serial_number: body.serial_number,
        location: body.location,
        metadata: body.metadata || {},
        status: body.status || 'active',
        installed_at: body.installed_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating device:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/devices - Update a device
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('devices')
      .update({
        name: body.name,
        type: body.type,
        manufacturer: body.manufacturer,
        model: body.model,
        serial_number: body.serial_number,
        location: body.location,
        metadata: body.metadata,
        status: body.status,
        last_seen_at: body.last_seen_at,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating device:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/devices - Delete a device
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting device:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}