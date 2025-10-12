import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const targetId = searchParams.get('target_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization_id parameter' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('reduction_initiatives')
      .select('*')
      .eq('organization_id', organizationId);

    // Filter by target if provided
    if (targetId) {
      query = query.eq('sustainability_target_id', targetId);
    }

    const { data: initiatives, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching initiatives:', error);
      return NextResponse.json(
        { error: 'Failed to fetch initiatives' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      initiatives: initiatives || []
    });

  } catch (error) {
    console.error('Error in GET /api/sustainability/initiatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      organization_id,
      metric_target_id,
      sustainability_target_id,
      name,
      description,
      initiative_type,
      estimated_reduction_tco2e,
      estimated_reduction_percentage,
      start_date,
      completion_date,
      implementation_status,
      capex,
      annual_opex,
      annual_savings,
      roi_years,
      confidence_score,
      risk_level,
      risks,
      dependencies
    } = body;

    // Validate required fields
    if (!organization_id || !name || !initiative_type || !estimated_reduction_tco2e || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the new initiative
    const { data: newInitiative, error: insertError } = await supabaseAdmin
      .from('reduction_initiatives')
      .insert({
        organization_id,
        metric_target_id: metric_target_id || null,
        sustainability_target_id: sustainability_target_id || null,
        name,
        description: description || null,
        initiative_type,
        estimated_reduction_tco2e,
        estimated_reduction_percentage: estimated_reduction_percentage || null,
        start_date,
        completion_date: completion_date || null,
        implementation_status: implementation_status || 'planned',
        capex: capex || null,
        annual_opex: annual_opex || null,
        annual_savings: annual_savings || null,
        roi_years: roi_years || null,
        confidence_score: confidence_score || 0.7,
        risk_level: risk_level || 'medium',
        risks: risks || null,
        dependencies: dependencies || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating initiative:', insertError);
      return NextResponse.json(
        { error: 'Failed to create initiative', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      initiative: newInitiative,
      message: 'Initiative created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/sustainability/initiatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
