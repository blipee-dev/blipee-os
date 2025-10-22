import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/agent-feedback
 *
 * Store user feedback on agent recommendations for learning
 *
 * This enables agents to:
 * - Learn what recommendations are relevant vs. not relevant
 * - Avoid recommending things users already have
 * - Track which insights users find helpful
 * - Improve over time based on user preferences
 *
 * Request Body:
 * {
 *   agentId: string              // 'carbonHunter', 'compliance', etc.
 *   recommendationType: string   // 'led_retrofit', 'energy_audit', etc.
 *   learningType: string         // 'recommendation_rejected', 'infrastructure_exists', etc.
 *   feedback: string             // 'already_installed', 'not_relevant', 'helpful'
 *   confidence: number           // 0.0 to 1.0
 *   context?: any                // Additional context
 *   feedbackReason?: string      // Optional user-provided reason
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      agentId,
      recommendationType,
      learningType,
      feedback,
      confidence = 1.0,
      context = {},
      feedbackReason
    } = body;

    // 4. Validate required fields
    if (!agentId || !learningType || !feedback) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['agentId', 'learningType', 'feedback']
        },
        { status: 400 }
      );
    }

    // 5. Validate confidence range
    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 1' },
        { status: 400 }
      );
    }

    // 6. Create Supabase client
    const supabase = createServerSupabaseClient();

    // 7. Check if similar learning already exists
    const { data: existingLearning } = await supabase
      .from('agent_learnings')
      .select('id, confidence')
      .eq('organization_id', orgInfo.organizationId)
      .eq('agent_id', agentId)
      .eq('recommendation_type', recommendationType)
      .eq('learning_type', learningType)
      .eq('feedback', feedback)
      .maybeSingle();

    let result;

    if (existingLearning) {
      // Update existing learning - increase confidence
      const newConfidence = Math.min(1.0, existingLearning.confidence + 0.1);

      const { data: updated, error: updateError } = await supabase
        .from('agent_learnings')
        .update({
          confidence: newConfidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLearning.id)
        .select()
        .single();

      if (updateError) throw updateError;

      result = updated;
      console.log(`[Agent Learning] Updated existing learning for ${agentId} - confidence: ${newConfidence}`);
    } else {
      // Create new learning
      const { data: created, error: insertError } = await supabase
        .from('agent_learnings')
        .insert({
          organization_id: orgInfo.organizationId,
          agent_id: agentId,
          learning_type: learningType,
          recommendation_type: recommendationType,
          context: context || {},
          feedback,
          feedback_reason: feedbackReason,
          confidence,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      result = created;
      console.log(`[Agent Learning] Created new learning for ${agentId}: ${feedback}`);
    }

    return NextResponse.json({
      success: true,
      learning: result,
      message: 'Feedback recorded. The AI will learn from this!'
    });

  } catch (error: any) {
    console.error('[Agent Feedback API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to record feedback',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/agent-feedback
 *
 * Get learnings for the organization (for debugging/admin)
 *
 * Query parameters:
 * - agentId: Filter by specific agent
 * - learningType: Filter by learning type
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const learningType = searchParams.get('learningType');

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('agent_learnings')
      .select('*')
      .eq('organization_id', orgInfo.organizationId)
      .order('created_at', { ascending: false });

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (learningType) {
      query = query.eq('learning_type', learningType);
    }

    const { data: learnings, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      learnings: learnings || [],
      count: learnings?.length || 0
    });

  } catch (error: any) {
    console.error('[Agent Feedback API] Error getting learnings:', error);
    return NextResponse.json(
      { error: 'Failed to get learnings', details: error.message },
      { status: 500 }
    );
  }
}
