import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Clean up duplicate SBTi targets, keeping only the most recent one per organization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Get all active targets for this organization
    const { data: allTargets, error: fetchError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('id, name, created_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching targets:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }

    if (!allTargets || allTargets.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        kept: allTargets?.length || 0,
        deleted: 0
      });
    }

    // Group by name to find duplicates
    const targetsByName = allTargets.reduce((acc, target) => {
      if (!acc[target.name]) {
        acc[target.name] = [];
      }
      acc[target.name].push(target);
      return acc;
    }, {} as Record<string, typeof allTargets>);

    let totalDeleted = 0;
    const keptTargets: string[] = [];

    // For each group, keep the most recent and delete the rest
    for (const [name, targets] of Object.entries(targetsByName)) {
      if (targets.length > 1) {
        // Keep the first one (most recent due to DESC order)
        const [keep, ...toDelete] = targets;
        keptTargets.push(keep.id);

        // Delete the duplicates
        const idsToDelete = toDelete.map(t => t.id);
        const { error: deleteError } = await supabaseAdmin
          .from('sustainability_targets')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Error deleting duplicates:', deleteError);
        } else {
          totalDeleted += idsToDelete.length;
        }
      } else {
        keptTargets.push(targets[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${totalDeleted} duplicate targets`,
      kept: keptTargets.length,
      deleted: totalDeleted
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
