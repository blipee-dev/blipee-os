import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/feedback
 * Save user feedback (thumbs up/down) for AI responses
 *
 * This feeds into the prompt optimization system by:
 * 1. Tracking which responses users like/dislike
 * 2. Linking feedback to specific prompt versions
 * 3. Triggering optimization jobs when negative feedback exceeds threshold
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, feedbackType, comment, metadata } = body;

    // Validate input
    if (!messageId || !feedbackType) {
      return NextResponse.json(
        { error: 'messageId and feedbackType are required' },
        { status: 400 }
      );
    }

    if (!['positive', 'negative'].includes(feedbackType)) {
      return NextResponse.json(
        { error: 'feedbackType must be "positive" or "negative"' },
        { status: 400 }
      );
    }

    // Get the message to extract prompt version
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, conversation_id, model, metadata')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id, organization_id')
      .eq('id', message.conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if feedback already exists (prevent duplicates)
    const { data: existingFeedback } = await supabase
      .from('ai_feedback')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingFeedback) {
      // Update existing feedback in ai_feedback
      const { error: updateError } = await supabase
        .from('ai_feedback')
        .update({
          feedback_type: feedbackType,
          comment: comment || null,
          metadata: {
            ...metadata,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        console.error('Error updating feedback:', updateError);
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        );
      }

      // Also update conversation_feedback if it exists
      const { data: existingConvFeedback } = await supabase
        .from('conversation_feedback')
        .select('id')
        .eq('conversation_id', message.conversation_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingConvFeedback) {
        await supabase
          .from('conversation_feedback')
          .update({
            feedback_type: feedbackType === 'positive' ? 'thumbs_up' : 'thumbs_down',
            feedback_value: {
              rating: feedbackType === 'positive' ? 5 : 1,
              comment: comment || null,
              source: 'chat_interface',
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', existingConvFeedback.id);
      }

      // Recalculate metrics for this prompt version
      await recalculateFeedbackMetrics(supabase, message.metadata?.prompt_version_id);

      return NextResponse.json({
        success: true,
        updated: true,
        feedbackId: existingFeedback.id
      });
    }

    // Create new feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('ai_feedback')
      .insert({
        message_id: messageId,
        user_id: user.id,
        feedback_type: feedbackType,
        rating: feedbackType === 'positive' ? 1 : -1,
        comment: comment || null,
        metadata: {
          ...metadata,
          model: message.model,
          prompt_version_id: message.metadata?.prompt_version_id,
          organization_id: conversation.organization_id
        }
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Also save to conversation_feedback table (FASE 2)
    // Get message index in conversation
    const { data: messageIndex } = await supabase
      .rpc('get_message_index', {
        p_conversation_id: message.conversation_id,
        p_message_id: messageId
      })
      .maybeSingle();

    // If we can't get index, count messages before this one
    let msgIndex = 0;
    if (!messageIndex) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', message.conversation_id)
        .lt('created_at', (await supabase
          .from('messages')
          .select('created_at')
          .eq('id', messageId)
          .single()).data?.created_at || new Date());

      msgIndex = count || 0;
    } else {
      msgIndex = messageIndex.index || 0;
    }

    // Insert into conversation_feedback
    await supabase
      .from('conversation_feedback')
      .insert({
        conversation_id: message.conversation_id,
        message_index: msgIndex,
        user_id: user.id,
        organization_id: conversation.organization_id,
        feedback_type: type === 'up' ? 'thumbs_up' : 'thumbs_down',
        feedback_value: {
          rating: type === 'up' ? 5 : 1,
          comment: comment || null,
          source: 'chat_interface'
        },
        applied_to_model: false
      });

    // Update feedback metrics for this prompt version
    if (message.metadata?.prompt_version_id) {
      await updateFeedbackMetrics(
        supabase,
        message.metadata.prompt_version_id,
        feedbackType
      );

      // Check if we should trigger optimization
      await checkOptimizationThreshold(
        supabase,
        message.metadata.prompt_version_id,
        conversation.organization_id
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id
    });

  } catch (error) {
    console.error('Error in feedback endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update feedback metrics for a prompt version
 */
async function updateFeedbackMetrics(
  supabase: any,
  promptVersionId: string,
  feedbackType: string
) {
  try {
    // Get current metrics
    const { data: version } = await supabase
      .from('ai_prompt_versions')
      .select('metadata')
      .eq('id', promptVersionId)
      .single();

    const currentMetrics = version?.metadata?.feedback_metrics || {
      total: 0,
      positive: 0,
      negative: 0,
      satisfaction_rate: 0
    };

    // Update counts
    currentMetrics.total += 1;
    if (feedbackType === 'positive') {
      currentMetrics.positive += 1;
    } else {
      currentMetrics.negative += 1;
    }

    // Calculate satisfaction rate
    currentMetrics.satisfaction_rate =
      currentMetrics.total > 0
        ? (currentMetrics.positive / currentMetrics.total) * 100
        : 0;

    // Save updated metrics
    await supabase
      .from('ai_prompt_versions')
      .update({
        metadata: {
          ...version?.metadata,
          feedback_metrics: currentMetrics,
          last_feedback_at: new Date().toISOString()
        }
      })
      .eq('id', promptVersionId);

  } catch (error) {
    console.error('Error updating feedback metrics:', error);
  }
}

/**
 * Recalculate feedback metrics from scratch (for updates)
 */
async function recalculateFeedbackMetrics(
  supabase: any,
  promptVersionId?: string
) {
  if (!promptVersionId) return;

  try {
    // Count all feedback for this prompt version
    const { data: feedbacks } = await supabase
      .from('ai_feedback')
      .select('feedback_type')
      .eq('metadata->prompt_version_id', promptVersionId);

    if (!feedbacks) return;

    const total = feedbacks.length;
    const positive = feedbacks.filter((f: any) => f.feedback_type === 'positive').length;
    const negative = feedbacks.filter((f: any) => f.feedback_type === 'negative').length;
    const satisfaction_rate = total > 0 ? (positive / total) * 100 : 0;

    // Update prompt version metrics
    const { data: version } = await supabase
      .from('ai_prompt_versions')
      .select('metadata')
      .eq('id', promptVersionId)
      .single();

    await supabase
      .from('ai_prompt_versions')
      .update({
        metadata: {
          ...version?.metadata,
          feedback_metrics: {
            total,
            positive,
            negative,
            satisfaction_rate
          },
          last_feedback_at: new Date().toISOString()
        }
      })
      .eq('id', promptVersionId);

  } catch (error) {
    console.error('Error recalculating feedback metrics:', error);
  }
}

/**
 * Check if negative feedback threshold is exceeded and trigger optimization
 */
async function checkOptimizationThreshold(
  supabase: any,
  promptVersionId: string,
  organizationId: string
) {
  try {
    // Get current metrics
    const { data: version } = await supabase
      .from('ai_prompt_versions')
      .select('metadata, prompt_text')
      .eq('id', promptVersionId)
      .single();

    if (!version) return;

    const metrics = version.metadata?.feedback_metrics;
    if (!metrics || metrics.total < 10) {
      // Need at least 10 feedback samples before triggering optimization
      return;
    }

    // Threshold: If satisfaction rate < 60% OR negative feedback > 40%
    const shouldOptimize =
      metrics.satisfaction_rate < 60 ||
      (metrics.negative / metrics.total) > 0.4;

    if (!shouldOptimize) return;

    // Check if optimization job already exists for this version
    const { data: existingJob } = await supabase
      .from('optimization_jobs')
      .select('id')
      .eq('target_type', 'prompt')
      .eq('target_id', promptVersionId)
      .in('status', ['pending', 'running'])
      .maybeSingle();

    if (existingJob) {
      // Job already queued or running
      return;
    }

    // Create optimization job
    await supabase
      .from('optimization_jobs')
      .insert({
        organization_id: organizationId,
        target_type: 'prompt',
        target_id: promptVersionId,
        priority: 'high', // High priority due to poor user feedback
        status: 'pending',
        config: {
          reason: 'low_satisfaction_rate',
          current_metrics: metrics,
          threshold_exceeded: {
            satisfaction_rate: metrics.satisfaction_rate,
            threshold: 60,
            negative_ratio: (metrics.negative / metrics.total) * 100
          }
        },
        metadata: {
          trigger: 'feedback_threshold',
          auto_created: true,
          created_at: new Date().toISOString()
        }
      });

    console.log(`🔄 Optimization job created for prompt version ${promptVersionId} due to low satisfaction (${metrics.satisfaction_rate.toFixed(1)}%)`);

  } catch (error) {
    console.error('Error checking optimization threshold:', error);
  }
}

/**
 * GET /api/feedback
 * Get feedback for a specific message (for debugging/admin)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const user = await getAPIUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId parameter required' },
        { status: 400 }
      );
    }

    const { data: feedback, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: feedback || null });

  } catch (error) {
    console.error('Error in feedback GET endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
