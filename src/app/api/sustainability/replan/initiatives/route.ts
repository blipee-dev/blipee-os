import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const metricTargetId = searchParams.get('metricTargetId');

    if (!metricTargetId) {
      return NextResponse.json(
        { error: 'Missing metricTargetId parameter' },
        { status: 400 }
      );
    }

    // Fetch initiatives for this metric target
    const { data: initiatives, error: initiativesError } = await supabaseAdmin
      .from('reduction_initiatives')
      .select('*')
      .eq('metric_target_id', metricTargetId)
      .order('estimated_reduction_tco2e', { ascending: false });

    if (initiativesError) {
      console.error('Error fetching initiatives:', initiativesError);
      return NextResponse.json(
        { error: 'Failed to fetch initiatives' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      initiatives: initiatives || [],
      count: initiatives?.length || 0
    });

  } catch (error) {
    console.error('Error in initiatives API:', error);
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
      metricTargetId,
      organizationId,
      name,
      description,
      estimatedReduction,
      estimatedCost,
      timeline
    } = body;

    if (!metricTargetId || !organizationId || !name || !description || estimatedReduction === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricTargetId, organizationId, name, description, estimatedReduction' },
        { status: 400 }
      );
    }

    // Create the initiative
    const { data: initiative, error: createError } = await supabaseAdmin
      .from('reduction_initiatives')
      .insert({
        metric_target_id: metricTargetId,
        organization_id: organizationId,
        name,
        description,
        estimated_reduction_tco2e: estimatedReduction,
        estimated_cost: estimatedCost || null,
        timeline: timeline || null,
        status: 'planned',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating initiative:', createError);
      return NextResponse.json(
        { error: 'Failed to create initiative' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      initiative
    });

  } catch (error) {
    console.error('Error in POST initiatives API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
