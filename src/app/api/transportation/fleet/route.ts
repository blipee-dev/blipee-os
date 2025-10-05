import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement actual fleet data fetching from database
    // For now, return empty fleet data
    const fleetData = {
      fleet: []
    };

    return NextResponse.json(fleetData);
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet data' },
      { status: 500 }
    );
  }
}
