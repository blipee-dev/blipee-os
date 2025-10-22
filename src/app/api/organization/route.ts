import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/auth/get-user-org';

export async function GET(request: NextRequest) {

  const user = await getAPIUser(request);
    if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's organization using the helper
    const orgData = await getUserOrganization(supabase);

    if (!orgData) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    // Return organization data
    return NextResponse.json({
      id: orgData.organization.id,
      name: orgData.organization.name,
      industry_primary: orgData.organization.industry_primary,
      company_size: orgData.organization.company_size,
      compliance_frameworks: orgData.organization.compliance_frameworks
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}