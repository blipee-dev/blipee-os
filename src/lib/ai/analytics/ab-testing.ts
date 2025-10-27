/**
 * A/B Testing Framework for Prompt Optimization
 *
 * Manages experiments to test different prompt variants with real users.
 * Automatically analyzes results and determines winning variants.
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExperimentVariant {
  id: string;
  promptVersionId: string;
  trafficPercentage: number;
}

export interface ExperimentConfig {
  name: string;
  description: string;
  variants: ExperimentVariant[];
  startDate?: Date;
  endDate?: Date;
}

export interface ExperimentResults {
  experimentId: string;
  experimentName: string;
  status: 'running' | 'completed' | 'stopped';
  variants: VariantPerformance[];
  winnerVariantId?: string;
  confidenceLevel?: number;
  totalConversations: number;
  startDate: string;
  endDate?: string;
}

export interface VariantPerformance {
  variantId: string;
  promptVersionId: string;
  conversationCount: number;
  avgRating: number;
  avgResponseTime: number;
  toolSuccessRate: number;
  helpfulPercentage: number;
  errorRate: number;
}

/**
 * Create a new A/B test experiment
 */
export async function createExperiment(
  config: ExperimentConfig,
  createdBy: string
): Promise<string | null> {
  try {
    // Validate traffic percentages sum to 100
    const totalTraffic = config.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      console.error('[A/B Testing] Traffic percentages must sum to 100%');
      return null;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('ai_ab_experiments')
      .insert({
        name: config.name,
        description: config.description,
        variants: config.variants,
        start_date: config.startDate?.toISOString() || new Date().toISOString(),
        end_date: config.endDate?.toISOString(),
        status: 'draft',
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[A/B Testing] Error creating experiment:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[A/B Testing] Failed to create experiment:', error);
    return null;
  }
}

/**
 * Start an experiment (change status to running)
 */
export async function startExperiment(experimentId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('ai_ab_experiments')
      .update({ status: 'running' })
      .eq('id', experimentId);

    if (error) {
      console.error('[A/B Testing] Error starting experiment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[A/B Testing] Failed to start experiment:', error);
    return false;
  }
}

/**
 * Stop an experiment
 */
export async function stopExperiment(experimentId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('ai_ab_experiments')
      .update({
        status: 'stopped',
        end_date: new Date().toISOString(),
      })
      .eq('id', experimentId);

    if (error) {
      console.error('[A/B Testing] Error stopping experiment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[A/B Testing] Failed to stop experiment:', error);
    return false;
  }
}

/**
 * Get experiment results with statistical analysis
 */
export async function getExperimentResults(experimentId: string, client?: SupabaseClient): Promise<ExperimentResults | null> {
  try {
    const supabase = client || createClient();

    // Get experiment details
    const { data: experiment, error: expError } = await supabase
      .from('ai_ab_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expError || !experiment) {
      console.error('[A/B Testing] Error fetching experiment:', expError);
      return null;
    }

    // Get analytics for each variant
    const variants = experiment.variants as ExperimentVariant[];
    const variantPerformance: VariantPerformance[] = [];

    for (const variant of variants) {
      const { data: analytics, error: analyticsError } = await supabase
        .from('ai_conversation_analytics')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id);

      if (analyticsError || !analytics || analytics.length === 0) {
        // No data for this variant yet
        variantPerformance.push({
          variantId: variant.id,
          promptVersionId: variant.promptVersionId,
          conversationCount: 0,
          avgRating: 0,
          avgResponseTime: 0,
          toolSuccessRate: 0,
          helpfulPercentage: 0,
          errorRate: 0,
        });
        continue;
      }

      // Calculate metrics
      const conversationCount = analytics.length;

      const ratings = analytics.filter((a) => a.user_rating !== null);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, a) => sum + (a.user_rating || 0), 0) / ratings.length
        : 0;

      const responseTimes = analytics.filter((a) => a.response_time_ms !== null);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / responseTimes.length
        : 0;

      const toolCalls = analytics.filter((a) => a.tool_success_rate !== null);
      const toolSuccessRate = toolCalls.length > 0
        ? toolCalls.reduce((sum, a) => sum + (a.tool_success_rate || 0), 0) / toolCalls.length
        : 100;

      const helpful = analytics.filter((a) => a.helpful !== null);
      const helpfulPercentage = helpful.length > 0
        ? (helpful.filter((a) => a.helpful === true).length / helpful.length) * 100
        : 0;

      const errors = analytics.filter((a) => a.error_occurred === true).length;
      const errorRate = (errors / conversationCount) * 100;

      variantPerformance.push({
        variantId: variant.id,
        promptVersionId: variant.promptVersionId,
        conversationCount,
        avgRating,
        avgResponseTime,
        toolSuccessRate,
        helpfulPercentage,
        errorRate,
      });
    }

    // Determine winner with statistical significance
    const { winnerVariantId, confidenceLevel } = determineWinner(variantPerformance);

    const totalConversations = variantPerformance.reduce(
      (sum, v) => sum + v.conversationCount,
      0
    );

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      status: experiment.status,
      variants: variantPerformance,
      winnerVariantId,
      confidenceLevel,
      totalConversations,
      startDate: experiment.start_date,
      endDate: experiment.end_date,
    };
  } catch (error) {
    console.error('[A/B Testing] Failed to get experiment results:', error);
    return null;
  }
}

/**
 * Determine winner using statistical analysis
 * Uses a composite score based on multiple metrics
 */
function determineWinner(variants: VariantPerformance[]): {
  winnerVariantId?: string;
  confidenceLevel?: number;
} {
  // Need at least 30 conversations per variant for statistical significance
  const MIN_SAMPLE_SIZE = 30;

  const validVariants = variants.filter((v) => v.conversationCount >= MIN_SAMPLE_SIZE);

  if (validVariants.length === 0) {
    return {}; // Not enough data
  }

  // Calculate composite scores (weighted average of metrics)
  const scores = validVariants.map((variant) => {
    const score =
      variant.avgRating * 0.30 +           // 30% weight on rating
      (variant.helpfulPercentage / 100) * 0.25 +  // 25% weight on helpfulness
      (variant.toolSuccessRate / 100) * 0.20 +    // 20% weight on tool success
      (1 - variant.errorRate / 100) * 0.15 +      // 15% weight on low error rate
      (1 - Math.min(variant.avgResponseTime / 10000, 1)) * 0.10; // 10% weight on speed

    return {
      variantId: variant.id,
      score,
      sampleSize: variant.conversationCount,
    };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];
  const runnerUp = scores[1];

  // Calculate confidence level based on score difference and sample size
  let confidenceLevel = 50; // Base confidence

  if (runnerUp) {
    const scoreDiff = winner.score - runnerUp.score;
    const avgSampleSize = (winner.sampleSize + runnerUp.sampleSize) / 2;

    // Higher difference = higher confidence
    if (scoreDiff > 0.15) confidenceLevel += 30;
    else if (scoreDiff > 0.10) confidenceLevel += 20;
    else if (scoreDiff > 0.05) confidenceLevel += 10;

    // Larger sample size = higher confidence
    if (avgSampleSize > 100) confidenceLevel += 15;
    else if (avgSampleSize > 50) confidenceLevel += 10;

    // Cap at 95%
    confidenceLevel = Math.min(confidenceLevel, 95);
  }

  return {
    winnerVariantId: winner.variantId,
    confidenceLevel,
  };
}

/**
 * Complete an experiment and optionally promote winner
 */
export async function completeExperiment(
  experimentId: string,
  promoteWinner: boolean = false,
  client?: SupabaseClient
): Promise<boolean> {
  try {
    const supabase = client || createClient();

    // Get experiment results
    const results = await getExperimentResults(experimentId, supabase);
    if (!results) {
      return false;
    }

    // Update experiment status
    const { error: updateError } = await supabase
      .from('ai_ab_experiments')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        winner_variant_id: results.winnerVariantId,
        confidence_level: results.confidenceLevel,
      })
      .eq('id', experimentId);

    if (updateError) {
      console.error('[A/B Testing] Error completing experiment:', updateError);
      return false;
    }

    // Promote winner if requested and confidence is high
    if (promoteWinner && results.winnerVariantId && (results.confidenceLevel || 0) >= 80) {
      const winnerVariant = results.variants.find((v) => v.variantId === results.winnerVariantId);
      if (winnerVariant) {
        // Set winner as default prompt
        await supabase
          .from('ai_prompt_versions')
          .update({ is_default: false })
          .eq('is_default', true);

        await supabase
          .from('ai_prompt_versions')
          .update({ is_default: true, is_active: true })
          .eq('id', winnerVariant.promptVersionId);
      }
    }

    return true;
  } catch (error) {
    console.error('[A/B Testing] Failed to complete experiment:', error);
    return false;
  }
}

/**
 * Get all active experiments
 */
export async function getActiveExperiments(client?: SupabaseClient): Promise<any[]> {
  const supabase = client || createClient();

  const { data, error } = await supabase
    .from('ai_ab_experiments')
    .select('*')
    .eq('status', 'running')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[A/B Testing] Error fetching experiments:', error);
    return [];
  }

  return data || [];
}

/**
 * Quick experiment setup with auto-generated variants
 */
export async function setupQuickExperiment(
  name: string,
  promptVersionIds: string[],
  durationDays: number = 7,
  createdBy: string
): Promise<string | null> {
  if (promptVersionIds.length < 2) {
    console.error('[A/B Testing] Need at least 2 prompt versions for A/B test');
    return null;
  }

  // Evenly distribute traffic
  const trafficPercentage = 100 / promptVersionIds.length;

  const variants: ExperimentVariant[] = promptVersionIds.map((id, index) => ({
    id: `variant_${index + 1}`,
    promptVersionId: id,
    trafficPercentage,
  }));

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  return createExperiment(
    {
      name,
      description: `Auto-generated A/B test comparing ${promptVersionIds.length} prompt variants`,
      variants,
      endDate,
    },
    createdBy
  );
}
