import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      organization_id,
      name,
      target_type,
      baseline_year,
      baseline_value,
      target_year,
      target_value,
      scopes,
      methodology
    } = body;

    // Validate required fields
    if (!organization_id || !name || !target_type || !baseline_year || !baseline_value || !target_year || !target_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate reduction percentage
    const reduction_percentage = baseline_value > 0
      ? ((baseline_value - target_value) / baseline_value * 100)
      : 0;

    // Determine status (default to approved when committing from recommendations)
    const status = 'approved';

    // Insert the new target
    const { data: newTarget, error: insertError } = await supabaseAdmin
      .from('sustainability_targets')
      .insert({
        organization_id,
        name,
        target_type,
        baseline_year,
        baseline_value,
        target_year,
        target_value,
        reduction_percentage,
        scopes: scopes || [],
        methodology: methodology || 'SBTi',
        status,
        current_emissions: null, // Will be calculated by the system
        performance_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting target:', insertError);
      return NextResponse.json(
        { error: 'Failed to commit target', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      target: newTarget,
      message: 'Target committed successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/sustainability/targets/commit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
