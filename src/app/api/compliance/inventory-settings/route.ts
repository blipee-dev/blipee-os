import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization with organization details using admin client
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, organizations(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const organizationName = (appUser.organizations as any)?.name || 'Your Organization';

    // Fetch inventory settings using admin client
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('organization_inventory_settings')
      .select('*')
      .eq('organization_id', appUser.organization_id)
      .single();

    if (settingsError) {
      // If no settings exist yet, return defaults
      if (settingsError.code === 'PGRST116') {
        return NextResponse.json({
          consolidation_approach: 'operational_control',
          gases_covered: ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],
          base_year: 2024,
          base_year_rationale: 'First complete year of data collection',
          assurance_level: 'none',
          gwp_version: 'AR6',
          reporting_period_start: '2024-01-01',
          reporting_period_end: '2024-12-31',
          organization_name: organizationName
        });
      }

      console.error('Error fetching inventory settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch inventory settings' }, { status: 500 });
    }

    return NextResponse.json({
      ...settings,
      organization_name: organizationName
    });
  } catch (error) {
    console.error('Error in inventory-settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization using admin client
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const body = await request.json();

    // Upsert inventory settings using admin client
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('organization_inventory_settings')
      .upsert({
        organization_id: appUser.organization_id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (settingsError) {
      console.error('Error upserting inventory settings:', settingsError);
      return NextResponse.json({ error: 'Failed to save inventory settings' }, { status: 500 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in inventory-settings POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
