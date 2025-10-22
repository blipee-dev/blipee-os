import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Force dynamic rendering - don't prerender this API route
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const targetId = params.id;
    const body = await request.json();

    const {
      organization_id,
      name,
      baseline_year,
      baseline_value,
      target_year,
      target_value,
      scopes
    } = body;

    // Validate required fields
    if (!organization_id) {
      return NextResponse.json(
        { error: 'Missing organization_id' },
        { status: 400 }
      );
    }

    // Calculate reduction percentage
    const reduction_percentage = baseline_value > 0
      ? ((baseline_value - target_value) / baseline_value * 100)
      : 0;

    // Update the target
    const { data: updatedTarget, error: updateError } = await supabaseAdmin
      .from('sustainability_targets')
      .update({
        name,
        baseline_year,
        baseline_value,
        target_year,
        target_value,
        reduction_percentage,
        scopes,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating target:', updateError);
      return NextResponse.json(
        { error: 'Failed to update target' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      target: updatedTarget
    });

  } catch (error) {
    console.error('Error in PATCH /api/sustainability/targets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization_id parameter' },
        { status: 400 }
      );
    }

    // Delete the target (cascade will handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from('sustainability_targets')
      .delete()
      .eq('id', targetId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting target:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete target' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Target deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/sustainability/targets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
