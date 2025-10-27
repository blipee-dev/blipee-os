/**
 * ML-Based Pattern Analysis System
 *
 * Analyzes conversation data to identify patterns and generate insights
 * for continuous prompt optimization. Uses statistical analysis and
 * AI-powered pattern detection.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface Pattern {
  type: 'failed_query' | 'tool_selection_error' | 'clarification_needed' | 'low_satisfaction' | 'token_inefficiency';
  description: string;
  exampleQueries: string[];
  frequency: number;
  suggestedImprovements: string;
  confidenceScore: number;
}

export interface AnalysisResult {
  patterns: Pattern[];
  overallMetrics: {
    avgRating: number;
    avgResponseTime: number;
    toolSuccessRate: number;
    clarificationRate: number;
    totalConversations: number;
  };
  recommendations: string[];
}

/**
 * Analyze conversations from a date range
 */
export async function analyzeConversationPatterns(
  daysToAnalyze: number = 7,
  supabaseClient?: SupabaseClient
): Promise<AnalysisResult> {
  // Create client if not provided (for server-side use)
  const supabase = supabaseClient || createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToAnalyze);

  // Fetch conversation analytics
  const { data: conversations, error } = await supabase
    .from('ai_conversation_analytics')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error || !conversations) {
    console.error('[Pattern Analysis] Error fetching conversations:', error);
    return {
      patterns: [],
      overallMetrics: {
        avgRating: 0,
        avgResponseTime: 0,
        toolSuccessRate: 0,
        clarificationRate: 0,
        totalConversations: 0,
      },
      recommendations: [],
    };
  }

  // Calculate overall metrics
  const overallMetrics = calculateOverallMetrics(conversations);

  // Identify patterns
  const patterns: Pattern[] = [];

  // 1. Failed queries pattern (errors or low ratings)
  const failedQueries = conversations.filter(
    (c) => c.error_occurred || (c.user_rating && c.user_rating <= 2)
  );
  if (failedQueries.length > 0) {
    patterns.push({
      type: 'failed_query',
      description: 'Queries that resulted in errors or received low ratings',
      exampleQueries: failedQueries.slice(0, 5).map((c) => c.user_message),
      frequency: failedQueries.length,
      suggestedImprovements: await generateImprovementSuggestions(
        failedQueries.map((c) => c.user_message),
        'failed_query'
      ),
      confidenceScore: calculateConfidenceScore(failedQueries.length, conversations.length),
    });
  }

  // 2. Tool selection errors
  const toolErrors = conversations.filter(
    (c) => c.tool_success_rate !== null && c.tool_success_rate < 80
  );
  if (toolErrors.length > 0) {
    patterns.push({
      type: 'tool_selection_error',
      description: 'Conversations where tool calls had low success rate',
      exampleQueries: toolErrors.slice(0, 5).map((c) => c.user_message),
      frequency: toolErrors.length,
      suggestedImprovements: await generateImprovementSuggestions(
        toolErrors.map((c) => c.user_message),
        'tool_selection_error'
      ),
      confidenceScore: calculateConfidenceScore(toolErrors.length, conversations.length),
    });
  }

  // 3. High clarification rate (assistant asking many questions)
  const highClarification = conversations.filter(
    (c) => c.clarifying_questions_asked && c.clarifying_questions_asked > 3
  );
  if (highClarification.length > 0) {
    patterns.push({
      type: 'clarification_needed',
      description: 'Queries where AI needed excessive clarification',
      exampleQueries: highClarification.slice(0, 5).map((c) => c.user_message),
      frequency: highClarification.length,
      suggestedImprovements: await generateImprovementSuggestions(
        highClarification.map((c) => c.user_message),
        'clarification_needed'
      ),
      confidenceScore: calculateConfidenceScore(highClarification.length, conversations.length),
    });
  }

  // 4. Low satisfaction scores
  const lowSatisfaction = conversations.filter(
    (c) => c.helpful === false || (c.user_rating && c.user_rating <= 3)
  );
  if (lowSatisfaction.length > 0) {
    patterns.push({
      type: 'low_satisfaction',
      description: 'Conversations with low user satisfaction',
      exampleQueries: lowSatisfaction.slice(0, 5).map((c) => c.user_message),
      frequency: lowSatisfaction.length,
      suggestedImprovements: await generateImprovementSuggestions(
        lowSatisfaction.map((c) => c.user_message),
        'low_satisfaction'
      ),
      confidenceScore: calculateConfidenceScore(lowSatisfaction.length, conversations.length),
    });
  }

  // 5. Token inefficiency (very high token usage)
  const avgTokens = overallMetrics.avgResponseTime;
  const highTokenUsage = conversations.filter(
    (c) => c.total_tokens && c.total_tokens > avgTokens * 2
  );
  if (highTokenUsage.length > 0) {
    patterns.push({
      type: 'token_inefficiency',
      description: 'Conversations with unusually high token usage',
      exampleQueries: highTokenUsage.slice(0, 5).map((c) => c.user_message),
      frequency: highTokenUsage.length,
      suggestedImprovements: await generateImprovementSuggestions(
        highTokenUsage.map((c) => c.user_message),
        'token_inefficiency'
      ),
      confidenceScore: calculateConfidenceScore(highTokenUsage.length, conversations.length),
    });
  }

  // Generate overall recommendations
  const recommendations = await generateOverallRecommendations(patterns, overallMetrics);

  return {
    patterns,
    overallMetrics,
    recommendations,
  };
}

/**
 * Calculate overall metrics from conversations
 */
function calculateOverallMetrics(conversations: any[]): AnalysisResult['overallMetrics'] {
  const totalConversations = conversations.length;

  if (totalConversations === 0) {
    return {
      avgRating: 0,
      avgResponseTime: 0,
      toolSuccessRate: 0,
      clarificationRate: 0,
      totalConversations: 0,
    };
  }

  const ratingsCount = conversations.filter((c) => c.user_rating !== null).length;
  const avgRating = ratingsCount > 0
    ? conversations.reduce((sum, c) => sum + (c.user_rating || 0), 0) / ratingsCount
    : 0;

  const responseTimesCount = conversations.filter((c) => c.response_time_ms !== null).length;
  const avgResponseTime = responseTimesCount > 0
    ? conversations.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / responseTimesCount
    : 0;

  const toolCallsCount = conversations.filter((c) => c.tool_success_rate !== null).length;
  const toolSuccessRate = toolCallsCount > 0
    ? conversations.reduce((sum, c) => sum + (c.tool_success_rate || 0), 0) / toolCallsCount
    : 100;

  const clarificationCount = conversations.filter((c) => c.clarifying_questions_asked && c.clarifying_questions_asked > 0).length;
  const clarificationRate = (clarificationCount / totalConversations) * 100;

  return {
    avgRating,
    avgResponseTime,
    toolSuccessRate,
    clarificationRate,
    totalConversations,
  };
}

/**
 * Calculate confidence score based on sample size
 */
function calculateConfidenceScore(patternCount: number, totalCount: number): number {
  const percentage = (patternCount / totalCount) * 100;

  // Confidence increases with frequency
  if (percentage > 20) return 95;
  if (percentage > 10) return 85;
  if (percentage > 5) return 75;
  if (percentage > 2) return 65;
  return 50;
}

/**
 * Generate improvement suggestions using AI
 */
async function generateImprovementSuggestions(
  exampleQueries: string[],
  patternType: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are an expert at optimizing AI assistant prompts.

Pattern Type: ${patternType}

Example user queries that had issues:
${exampleQueries.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Based on these examples, suggest specific improvements to the system prompt that would:
1. Prevent these types of issues
2. Improve AI understanding of user intent
3. Guide the AI to better handle similar queries

Provide concise, actionable suggestions (2-3 sentences).`,
    });

    return text;
  } catch (error) {
    console.error('[Pattern Analysis] Error generating suggestions:', error);
    return 'Unable to generate suggestions at this time.';
  }
}

/**
 * Generate overall recommendations based on all patterns
 */
async function generateOverallRecommendations(
  patterns: Pattern[],
  metrics: AnalysisResult['overallMetrics']
): Promise<string[]> {
  const recommendations: string[] = [];

  // High-level recommendations based on metrics
  if (metrics.avgRating < 3.5) {
    recommendations.push('Overall satisfaction is low. Consider revising core prompt instructions for clarity.');
  }

  if (metrics.toolSuccessRate < 85) {
    recommendations.push('Tool selection accuracy is below target. Add more explicit tool usage examples to prompt.');
  }

  if (metrics.clarificationRate > 40) {
    recommendations.push('AI is asking for clarification frequently. Improve prompt to better interpret ambiguous queries.');
  }

  // Pattern-specific recommendations
  const highConfidencePatterns = patterns.filter((p) => p.confidenceScore > 80);
  if (highConfidencePatterns.length > 0) {
    recommendations.push(`${highConfidencePatterns.length} high-confidence patterns detected. Review pattern details for specific improvements.`);
  }

  return recommendations;
}

/**
 * Save pattern insights to database
 */
export async function savePatternInsights(
  patterns: Pattern[],
  supabaseClient?: SupabaseClient
): Promise<void> {
  // Create client if not provided (for server-side use)
  const supabase = supabaseClient || createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const pattern of patterns) {
    const { error } = await supabase
      .from('ai_pattern_insights')
      .insert({
        pattern_type: pattern.type,
        pattern_description: pattern.description,
        example_queries: pattern.exampleQueries,
        frequency: pattern.frequency,
        suggested_prompt_improvements: pattern.suggestedImprovements,
        confidence_score: pattern.confidenceScore,
        analyzed_from: weekAgo.toISOString(),
        analyzed_to: now.toISOString(),
      });

    if (error) {
      console.error('[Pattern Analysis] Error saving pattern:', error);
    }
  }
}

/**
 * Get top actionable patterns
 */
export async function getTopActionablePatterns(
  limit: number = 10,
  supabaseClient?: SupabaseClient
): Promise<any[]> {
  // Create client if not provided (for server-side use)
  const supabase = supabaseClient || createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('ai_pattern_insights')
    .select('*')
    .eq('is_actionable', true)
    .eq('is_resolved', false)
    .order('frequency', { ascending: false })
    .order('confidence_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Pattern Analysis] Error fetching patterns:', error);
    return [];
  }

  return data || [];
}
