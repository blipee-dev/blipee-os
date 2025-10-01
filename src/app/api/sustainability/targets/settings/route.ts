import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get organization settings
    const { data: settings } = await supabaseAdmin
      .from('organization_target_settings')
      .select('*')
      .eq('organization_id', memberData.organization_id)
      .single();

    // If no settings exist, create defaults
    if (!settings) {
      const defaultSettings = {
        organization_id: memberData.organization_id,
        preferred_framework: 'sbti_15c',
        include_scope1: true,
        include_scope2: true,
        include_scope3: true,
        scope3_threshold_percent: 40,
        max_offset_percent: 10,
        reporting_frequency: 'annual',
        fiscal_year_end_month: 12,
        created_by: user.id
      };

      const { data: newSettings } = await supabaseAdmin
        .from('organization_target_settings')
        .insert(defaultSettings)
        .select()
        .single();

      return NextResponse.json(newSettings);
    }

    // Get dynamic values using database functions
    const { data: dynamicValues } = await supabaseAdmin.rpc('get_baseline_year', {
      org_id: memberData.organization_id
    });

    const { data: targetYear } = await supabaseAdmin.rpc('calculate_target_year', {
      org_id: memberData.organization_id,
      min_years_out: 5
    });

    const { data: reductionTarget } = await supabaseAdmin.rpc('get_reduction_target', {
      org_id: memberData.organization_id,
      target_type: 'near_term'
    });

    return NextResponse.json({
      ...settings,
      calculated: {
        baselineYear: dynamicValues,
        targetYear: targetYear,
        reductionTarget: reductionTarget
      }
    });

  } catch (error) {
    console.error('Error fetching target settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and check permissions
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has permission to update settings
    if (!['account_owner', 'sustainability_manager'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updates = await request.json();

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabaseAdmin
      .from('organization_target_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', memberData.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating settings:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Error updating target settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}