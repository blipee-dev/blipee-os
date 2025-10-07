import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Return default values (peak demand data not yet available)
    // TODO: Calculate peak demand metrics from time-series energy data
    return NextResponse.json({
      peakDemand: { value: 0, unit: 'kW', time: 'N/A' },
      offPeakUsage: { percentage: 0, savings: 0 },
      loadFactor: { value: 0, target: 0.85 },
      powerFactor: { value: 0, target: 0.95 }
    });

  } catch (error) {
    console.error('Error fetching peak demand metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peak demand metrics' },
      { status: 500 }
    );
  }
}
