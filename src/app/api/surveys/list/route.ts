import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

/**
 * Get list of surveys for an organization
 * GET /api/surveys/list?organization_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to the organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (orgInfo.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch surveys
    const { data: surveys, error: fetchError } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching surveys:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch surveys', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ surveys: surveys || [] });
  } catch (error) {
    console.error('Error in surveys list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
