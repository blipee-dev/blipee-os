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

    // TODO: Implement actual business travel data fetching from database
    // For now, return empty travel data
    const travelData = {
      travel: []
    };

    return NextResponse.json(travelData);
  } catch (error) {
    console.error('Error fetching business travel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business travel data' },
      { status: 500 }
    );
  }
}
