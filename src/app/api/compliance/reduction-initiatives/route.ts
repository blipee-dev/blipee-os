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

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;

    // Get optional filters from query params
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    // Build query
    let query = supabaseAdmin
      .from('reduction_initiatives')
      .select('*')
      .eq('organization_id', organizationId)
      .order('implementation_year', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (year) {
      query = query.eq('implementation_year', parseInt(year));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: initiatives, error } = await query;

    if (error) {
      console.error('Error fetching reduction initiatives:', error);
      // Return empty array if table doesn't exist, has RLS issues, or missing columns
      // This allows the UI to gracefully handle missing data
      // 42P01: table doesn't exist, PGRST116: RLS error, 42703: column doesn't exist
      if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '42703') {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: 'Failed to fetch reduction initiatives' }, { status: 500 });
    }

    return NextResponse.json(initiatives || []);
  } catch (error) {
    console.error('Error in reduction-initiatives API:', error);
    // Return empty array to gracefully handle any errors
    // The UI can function without reduction initiatives data
    return NextResponse.json([]);
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
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const body = await request.json();

    // Insert new reduction initiative
    const { data: initiative, error: insertError } = await supabaseAdmin
      .from('reduction_initiatives')
      .insert({
        organization_id: appUser.organization_id,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating reduction initiative:', insertError);
      return NextResponse.json({ error: 'Failed to create reduction initiative' }, { status: 500 });
    }

    return NextResponse.json(initiative);
  } catch (error) {
    console.error('Error in reduction-initiatives POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Initiative ID is required' }, { status: 400 });
    }

    // Update reduction initiative
    const { data: initiative, error: updateError } = await supabaseAdmin
      .from('reduction_initiatives')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', appUser.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reduction initiative:', updateError);
      return NextResponse.json({ error: 'Failed to update reduction initiative' }, { status: 500 });
    }

    return NextResponse.json(initiative);
  } catch (error) {
    console.error('Error in reduction-initiatives PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Initiative ID is required' }, { status: 400 });
    }

    // Delete reduction initiative
    const { error: deleteError } = await supabaseAdmin
      .from('reduction_initiatives')
      .delete()
      .eq('id', id)
      .eq('organization_id', appUser.organization_id);

    if (deleteError) {
      console.error('Error deleting reduction initiative:', deleteError);
      return NextResponse.json({ error: 'Failed to delete reduction initiative' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in reduction-initiatives DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
