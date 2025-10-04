import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Get year parameter
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Fetch TCFD disclosures
    const { data: disclosures, error: disclosuresError } = await supabase
      .from('tcfd_disclosures')
      .select('*')
      .eq('organization_id', appUser.organization_id)
      .eq('reporting_year', parseInt(year))
      .single();

    if (disclosuresError) {
      // If no disclosures exist yet, return empty structure
      if (disclosuresError.code === 'PGRST116') {
        return NextResponse.json({
          reporting_year: parseInt(year),
          organization_id: appUser.organization_id,
          board_oversight: null,
          management_role: null,
          climate_risks: null,
          climate_opportunities: null,
          scenario_analysis: null,
          business_strategy_impact: null,
          risk_identification_process: null,
          risk_management_process: null,
          integration_with_erm: null,
          metrics: null,
          targets: null,
          executive_remuneration_link: null
        });
      }

      console.error('Error fetching TCFD disclosures:', disclosuresError);
      return NextResponse.json({ error: 'Failed to fetch TCFD disclosures' }, { status: 500 });
    }

    return NextResponse.json(disclosures);
  } catch (error) {
    console.error('Error in tcfd API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Upsert TCFD disclosures
    const { data: disclosures, error: disclosuresError } = await supabase
      .from('tcfd_disclosures')
      .upsert({
        organization_id: appUser.organization_id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (disclosuresError) {
      console.error('Error upserting TCFD disclosures:', disclosuresError);
      return NextResponse.json({ error: 'Failed to save TCFD disclosures' }, { status: 500 });
    }

    return NextResponse.json(disclosures);
  } catch (error) {
    console.error('Error in tcfd POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
