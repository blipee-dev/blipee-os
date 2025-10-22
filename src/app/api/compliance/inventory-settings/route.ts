import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const siteId = searchParams.get('siteId');

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

    // Fetch GHG inventory settings for the specific year using admin client
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('ghg_inventory_settings')
      .select('*')
      .eq('organization_id', appUser.organization_id)
      .eq('reporting_year', parseInt(year))
      .single();

    if (settingsError) {
      // If no settings exist yet, return defaults
      if (settingsError.code === 'PGRST116') {
        return NextResponse.json({
          consolidation_approach: 'operational_control',
          gases_covered: ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],
          base_year: 2023,
          base_year_rationale: 'Base year 2023 selected as the first complete year with comprehensive data collection across all facilities and emission sources.',
          assurance_level: 'none',
          gwp_version: 'AR6',
          reporting_period_start: `${year}-01-01`,
          reporting_period_end: `${year}-12-31`,
          organization_name: organizationName
        });
      }

      console.error('Error fetching inventory settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch inventory settings' }, { status: 500 });
    }

    return NextResponse.json({
      consolidation_approach: settings.consolidation_approach,
      gases_covered: settings.gases_covered,
      base_year: settings.base_year,
      base_year_rationale: settings.base_year_rationale,
      assurance_level: settings.assurance_level || 'none',
      assurance_provider: settings.assurance_provider,
      gwp_version: settings.gwp_standard || 'AR6',
      reporting_period_start: settings.period_start,
      reporting_period_end: settings.period_end,
      organization_name: organizationName
    });
  } catch (error) {
    console.error('Error in inventory-settings API:', error);
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
