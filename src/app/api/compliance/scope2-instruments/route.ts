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

    // Fetch scope 2 instruments
    let query = supabase
      .from('scope2_instruments')
      .select('*')
      .eq('organization_id', appUser.organization_id)
      .order('valid_from', { ascending: false });

    if (year) {
      query = query
        .gte('valid_from', `${year}-01-01`)
        .lte('valid_to', `${year}-12-31`);
    }

    const { data: instruments, error: instrumentsError } = await query;

    if (instrumentsError) {
      console.error('Error fetching scope2 instruments:', instrumentsError);
      return NextResponse.json({ error: 'Failed to fetch scope 2 instruments' }, { status: 500 });
    }

    return NextResponse.json(instruments || []);
  } catch (error) {
    console.error('Error in scope2-instruments API:', error);
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

    // Insert scope 2 instrument
    const { data: instrument, error: instrumentError } = await supabase
      .from('scope2_instruments')
      .insert({
        organization_id: appUser.organization_id,
        ...body
      })
      .select()
      .single();

    if (instrumentError) {
      console.error('Error creating scope2 instrument:', instrumentError);
      return NextResponse.json({ error: 'Failed to create scope 2 instrument' }, { status: 500 });
    }

    return NextResponse.json(instrument);
  } catch (error) {
    console.error('Error in scope2-instruments POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
