/**
 * Conversation Analytics Tracker
 *
 * Tracks AI conversation metrics for ML-based prompt optimization.
 * Records performance data, tool usage, user feedback, and outcomes.
 */

import { createClient } from '@/lib/supabase/client';
import type { Message } from 'ai';

export interface ToolCall {
  name: string;
  success: boolean;
  error?: string;
  execution_time_ms: number;
}

export interface ConversationMetrics {
  conversationId: string;
  userId: string;
  organizationId: string;
  messageId: string;
  userMessage: string;
  assistantResponse?: string;
  responseTimeMs?: number;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  toolsCalled?: ToolCall[];
  toolSuccessRate?: number;
  clarifyingQuestionsAsked?: number;
  pageContext?: string;
  conversationLength?: number;
  modelId: string;
  promptVersion: string;
  experimentId?: string;
  variantId?: string;
}

export interface UserFeedback {
  messageId: string;
  rating?: number; // 1-5 stars
  feedback?: string;
  helpful?: boolean; // Thumbs up/down
  taskCompleted?: boolean;
  requiredFollowup?: boolean;
}

/**
 * Track a conversation interaction
 */
export async function trackConversation(metrics: ConversationMetrics): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('ai_conversation_analytics')
      .insert({
        conversation_id: metrics.conversationId,
        user_id: metrics.userId,
        organization_id: metrics.organizationId,
        message_id: metrics.messageId,
        user_message: metrics.userMessage,
        assistant_response: metrics.assistantResponse,
        response_time_ms: metrics.responseTimeMs,
        total_tokens: metrics.totalTokens,
        prompt_tokens: metrics.promptTokens,
        completion_tokens: metrics.completionTokens,
        tools_called: metrics.toolsCalled || [],
        tool_success_rate: metrics.toolSuccessRate,
        clarifying_questions_asked: metrics.clarifyingQuestionsAsked || 0,
        page_context: metrics.pageContext,
        conversation_length: metrics.conversationLength,
        model_id: metrics.modelId,
        prompt_version: metrics.promptVersion,
        experiment_id: metrics.experimentId,
        variant_id: metrics.variantId,
      });

    if (error) {
      console.error('[Analytics] Error tracking conversation:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track conversation:', error);
  }
}

/**
 * Update conversation with user feedback
 */
export async function trackUserFeedback(feedback: UserFeedback): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('ai_conversation_analytics')
      .update({
        user_rating: feedback.rating,
        user_feedback: feedback.feedback,
        helpful: feedback.helpful,
        task_completed: feedback.taskCompleted,
        required_followup: feedback.requiredFollowup,
      })
      .eq('message_id', feedback.messageId);

    if (error) {
      console.error('[Analytics] Error tracking feedback:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track feedback:', error);
  }
}

/**
 * Track an error in conversation
 */
export async function trackConversationError(
  messageId: string,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('ai_conversation_analytics')
      .update({
        error_occurred: true,
        error_message: errorMessage,
      })
      .eq('message_id', messageId);

    if (error) {
      console.error('[Analytics] Error tracking error:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track error:', error);
  }
}

/**
 * Calculate tool success rate from tool calls
 */
export function calculateToolSuccessRate(tools: ToolCall[]): number {
  if (tools.length === 0) return 100;

  const successCount = tools.filter((t) => t.success).length;
  return (successCount / tools.length) * 100;
}

/**
 * Detect if AI asked clarifying questions
 */
export function detectClarifyingQuestions(assistantMessage: string): number {
  // Count question marks as a simple heuristic
  // More sophisticated: check for phrases like "What", "Which", "Could you", etc.
  const questionCount = (assistantMessage.match(/\?/g) || []).length;

  // Also check for common clarifying phrases
  const clarifyingPhrases = [
    'Could you clarify',
    'What type of',
    'Which',
    'Can you provide',
    'Do you mean',
    'Could you specify',
    'What value',
    'For which',
  ];

  const phraseMatches = clarifyingPhrases.filter((phrase) =>
    assistantMessage.includes(phrase)
  ).length;

  return Math.max(questionCount, phraseMatches);
}

/**
 * Extract metrics from AI SDK messages
 */
export function extractMetricsFromMessages(messages: Message[]): {
  toolsCalled: ToolCall[];
  clarifyingQuestionsAsked: number;
} {
  const toolsCalled: ToolCall[] = [];
  let clarifyingQuestionsAsked = 0;

  for (const message of messages) {
    // Extract tool calls from assistant messages
    if (message.role === 'assistant') {
      // Count clarifying questions
      if (message.content) {
        clarifyingQuestionsAsked += detectClarifyingQuestions(message.content);
      }

      // Extract tool usage from experimental_providerMetadata if available
      // This depends on AI SDK implementation details
      // For now, we'll handle this in the API route where we have full context
    }
  }

  return {
    toolsCalled,
    clarifyingQuestionsAsked,
  };
}

/**
 * Get current prompt version from environment or default
 */
export function getCurrentPromptVersion(): string {
  return process.env.NEXT_PUBLIC_AI_PROMPT_VERSION || 'v1.0';
}

/**
 * Get A/B test assignment for user
 * Returns experiment ID and variant ID if user is in an active experiment
 */
export async function getABTestAssignment(
  userId: string,
  organizationId: string
): Promise<{ experimentId?: string; variantId?: string; promptVersion?: string }> {
  try {
    const supabase = createClient();

    // Get active experiments
    const { data: experiments, error } = await supabase
      .from('ai_ab_experiments')
      .select('*')
      .eq('status', 'running')
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

    if (error || !experiments || experiments.length === 0) {
      return {};
    }

    // For simplicity, use the first active experiment
    const experiment = experiments[0];

    // Assign user to variant based on user ID hash (consistent assignment)
    const hash = hashString(userId + organizationId);
    const variants = experiment.variants as Array<{
      id: string;
      prompt_version_id: string;
      traffic_percentage: number;
    }>;

    // Determine variant based on traffic distribution
    let cumulativePercentage = 0;
    const hashPercentage = hash % 100;

    for (const variant of variants) {
      cumulativePercentage += variant.traffic_percentage;
      if (hashPercentage < cumulativePercentage) {
        return {
          experimentId: experiment.id,
          variantId: variant.id,
          promptVersion: variant.prompt_version_id,
        };
      }
    }

    return {};
  } catch (error) {
    console.error('[Analytics] Failed to get A/B test assignment:', error);
    return {};
  }
}

/**
 * Simple hash function for consistent user assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
