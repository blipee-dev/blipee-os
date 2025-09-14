import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/devices/templates - Get all device templates
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('device_templates')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching device templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/devices/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}