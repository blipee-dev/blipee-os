import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Get year parameter if provided
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const adjustmentType = searchParams.get('type'); // 'removal', 'offset', 'credit', 'sequestration'

    // Fetch emissions adjustments
    let query = supabase
      .from('emissions_adjustments')
      .select('*')
      .eq('organization_id', appUser.organization_id)
      .order('period_start', { ascending: false });

    if (year) {
      query = query
        .gte('period_start', `${year}-01-01`)
        .lte('period_end', `${year}-12-31`);
    }

    if (adjustmentType) {
      query = query.eq('adjustment_type', adjustmentType);
    }

    const { data: adjustments, error: adjustmentsError } = await query;

    if (adjustmentsError) {
      console.error('Error fetching emissions adjustments:', adjustmentsError);
      return NextResponse.json({ error: 'Failed to fetch emissions adjustments' }, { status: 500 });
    }

    return NextResponse.json(adjustments || []);
  } catch (error) {
    console.error('Error in emissions-adjustments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const body = await request.json();

    // Insert emissions adjustment
    const { data: adjustment, error: adjustmentError } = await supabase
      .from('emissions_adjustments')
      .insert({
        organization_id: appUser.organization_id,
        ...body
      })
      .select()
      .single();

    if (adjustmentError) {
      console.error('Error creating emissions adjustment:', adjustmentError);
      return NextResponse.json({ error: 'Failed to create emissions adjustment' }, { status: 500 });
    }

    return NextResponse.json(adjustment);
  } catch (error) {
    console.error('Error in emissions-adjustments POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
