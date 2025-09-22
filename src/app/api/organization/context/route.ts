import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DatabaseContextService } from '@/lib/ai/database-context';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization context
    const context = await DatabaseContextService.getUserOrganizationContext(user.id);

    if (!context) {
      return NextResponse.json({
        organization: null,
        sites: [],
        devices: [],
        users: [],
        emissions: [],
        message: 'No organization found for user'
      });
    }

    // Return summary data
    return NextResponse.json({
      organization: {
        id: context.organization?.id,
        name: context.organization?.name,
        industry: context.organization?.industry_primary
      },
      sites: context.sites?.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        size_sqft: s.size_sqft
      })) || [],
      devices: context.devices?.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status
      })) || [],
      users: context.users?.length || 0,
      emissions: {
        count: context.emissions?.length || 0,
        latest: context.emissions?.[0]
      },
      targets: context.targets?.length || 0,
      reports: context.reports?.length || 0
    });

  } catch (error) {
    console.error('Error getting organization context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}