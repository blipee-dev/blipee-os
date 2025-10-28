import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/ai-prompt-optimization/prompt-versions
 * Get all prompt versions with feedback metrics (super admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // active, deprecated, archived

    // Build query
    let query = supabase
      .from('ai_prompt_versions')
      .select('id, version_number, status, content_hash, created_at, metadata, organization_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: versions, error } = await query;

    if (error) {
      console.error('Error fetching prompt versions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt versions' },
        { status: 500 }
      );
    }

    // Calculate aggregate stats
    const stats = {
      total: versions?.length || 0,
      byStatus: {
        active: versions?.filter(v => v.status === 'active').length || 0,
        deprecated: versions?.filter(v => v.status === 'deprecated').length || 0,
        archived: versions?.filter(v => v.status === 'archived').length || 0,
      },
      totalFeedback: versions?.reduce((sum, v) =>
        sum + (v.metadata?.feedback_metrics?.total || 0), 0
      ) || 0,
      averageSatisfaction: calculateAverageSatisfaction(versions || []),
    };

    return NextResponse.json({
      versions: versions || [],
      stats
    });

  } catch (error) {
    console.error('Error in prompt versions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate average satisfaction rate across all versions with feedback
 */
function calculateAverageSatisfaction(versions: any[]): number {
  const versionsWithFeedback = versions.filter(
    v => v.metadata?.feedback_metrics?.total > 0
  );

  if (versionsWithFeedback.length === 0) return 0;

  const totalSatisfaction = versionsWithFeedback.reduce(
    (sum, v) => sum + (v.metadata.feedback_metrics.satisfaction_rate || 0),
    0
  );

  return totalSatisfaction / versionsWithFeedback.length;
}
