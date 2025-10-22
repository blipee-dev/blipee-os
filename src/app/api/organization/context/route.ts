import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { DatabaseContextService } from '@/lib/ai/database-context';

export async function GET(request: NextRequest) {
  console.log('🔍 [ORG-CONTEXT] API called');

  try {
    // Get authenticated user using session-based auth
    const user = await getAPIUser(request);
    console.log('🔍 [ORG-CONTEXT] User auth result:', user ? `✅ ${user.id} (${user.email})` : '❌ No user');

    if (!user) {
      console.log('🔍 [ORG-CONTEXT] Returning 401 - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization context
    console.log('🔍 [ORG-CONTEXT] Fetching organization context for user:', user.id);
    const context = await DatabaseContextService.getUserOrganizationContext(user.id);
    console.log('🔍 [ORG-CONTEXT] Context result:', context ? `✅ Org: ${context.organization?.name}` : '❌ No context');

    if (!context) {
      console.log('🔍 [ORG-CONTEXT] No organization found for user');
      return NextResponse.json({
        organization: null,
        sites: [],
        devices: [],
        users: [],
        emissions: [],
        message: 'No organization found for user'
      });
    }

    const response = {
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
    };

    console.log('🔍 [ORG-CONTEXT] Returning:', {
      org: response.organization?.name,
      sites: response.sites.length,
      devices: response.devices.length,
      users: response.users
    });

    // Return summary data
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [ORG-CONTEXT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}