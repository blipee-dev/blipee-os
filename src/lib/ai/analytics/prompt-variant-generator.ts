/**
 * Prompt Variant Generation Engine
 *
 * Automatically generates improved versions of system prompts based on
 * identified patterns and performance metrics. Uses AI to create variants
 * that address specific issues while maintaining core functionality.
 */

import { createClient } from '@/lib/supabase/client';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { Pattern } from './pattern-analyzer';

export interface PromptVariant {
  versionName: string;
  promptText: string;
  description: string;
  changes: string[];
  targetedPatterns: string[];
}

export interface VariantGenerationConfig {
  basePrompt: string;
  patterns: Pattern[];
  improvementStrategy: 'conservative' | 'moderate' | 'aggressive';
  variantCount: number;
}

/**
 * Generate prompt variants based on identified patterns
 */
export async function generatePromptVariants(
  config: VariantGenerationConfig
): Promise<PromptVariant[]> {
  const variants: PromptVariant[] = [];

  // Sort patterns by confidence and frequency
  const prioritizedPatterns = [...config.patterns].sort(
    (a, b) => b.confidenceScore * b.frequency - a.confidenceScore * a.frequency
  );

  // Generate variants addressing different pattern combinations
  for (let i = 0; i < config.variantCount; i++) {
    const patternsToAddress = prioritizedPatterns.slice(0, Math.min(3, prioritizedPatterns.length));

    const variant = await generateSingleVariant(
      config.basePrompt,
      patternsToAddress,
      config.improvementStrategy,
      i + 1
    );

    if (variant) {
      variants.push(variant);
    }
  }

  return variants;
}

/**
 * Generate a single prompt variant
 */
async function generateSingleVariant(
  basePrompt: string,
  patterns: Pattern[],
  strategy: 'conservative' | 'moderate' | 'aggressive',
  variantNumber: number
): Promise<PromptVariant | null> {
  try {
    const strategyGuidance = getStrategyGuidance(strategy);

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: `You are an expert at optimizing AI assistant system prompts.

**Current System Prompt:**
${basePrompt}

**Identified Performance Issues:**
${patterns.map((p, i) => `
${i + 1}. ${p.type} (Frequency: ${p.frequency}, Confidence: ${p.confidenceScore}%)
   Description: ${p.description}
   Suggested Improvements: ${p.suggestedImprovements}
   Example queries:
   ${p.exampleQueries.map((q) => `   - "${q}"`).join('\n')}
`).join('\n')}

**Improvement Strategy:** ${strategy}
${strategyGuidance}

Generate an improved version of the system prompt that addresses the identified issues while maintaining all existing capabilities.

IMPORTANT INSTRUCTIONS:
1. Keep the core structure and all existing tool capabilities
2. Add specific guidance to prevent the identified patterns
3. Make changes that are ${strategy} - ${strategy === 'conservative' ? 'minimal and focused' : strategy === 'moderate' ? 'balanced and thoughtful' : 'comprehensive and bold'}
4. Ensure the prompt remains clear and actionable
5. Don't remove existing instructions, only enhance them

Output ONLY the improved prompt text, no explanations or meta-commentary.`,
    });

    // Extract changes by comparing prompts
    const changes = extractPromptChanges(basePrompt, text, patterns);

    return {
      versionName: `v1.${variantNumber}-${strategy}`,
      promptText: text,
      description: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} improvements addressing ${patterns.map(p => p.type).join(', ')}`,
      changes,
      targetedPatterns: patterns.map((p) => p.type),
    };
  } catch (error) {
    console.error('[Variant Generation] Error generating variant:', error);
    return null;
  }
}

/**
 * Get strategy-specific guidance
 */
function getStrategyGuidance(strategy: 'conservative' | 'moderate' | 'aggressive'): string {
  switch (strategy) {
    case 'conservative':
      return `Make minimal, focused changes. Only address the highest-priority patterns. Preserve the exact wording of existing instructions wherever possible. Add small clarifications or examples rather than rewriting sections.`;

    case 'moderate':
      return `Make balanced improvements. Address the top patterns with thoughtful enhancements. You can rephrase sections for clarity but maintain the overall structure and intent. Add helpful examples and explicit guidance.`;

    case 'aggressive':
      return `Make comprehensive improvements. Significantly enhance the prompt structure, add detailed examples, create new sections if needed, and thoroughly address all identified patterns. Be bold in reorganizing for maximum clarity and effectiveness.`;

    default:
      return '';
  }
}

/**
 * Extract key changes between prompts
 */
function extractPromptChanges(
  originalPrompt: string,
  newPrompt: string,
  patterns: Pattern[]
): string[] {
  const changes: string[] = [];

  // Simple heuristic: look for new sections or significantly expanded sections
  const originalSections = originalPrompt.split('\n\n');
  const newSections = newPrompt.split('\n\n');

  if (newSections.length > originalSections.length) {
    changes.push(`Added ${newSections.length - originalSections.length} new section(s)`);
  }

  // Check for pattern-specific keywords
  for (const pattern of patterns) {
    if (pattern.type === 'tool_selection_error' && newPrompt.includes('tool') && !originalPrompt.includes('tool usage examples')) {
      changes.push('Enhanced tool selection guidance');
    }
    if (pattern.type === 'clarification_needed' && newPrompt.toLowerCase().includes('ambiguous')) {
      changes.push('Improved handling of ambiguous queries');
    }
    if (pattern.type === 'failed_query' && newPrompt.includes('error')) {
      changes.push('Added error prevention guidelines');
    }
  }

  // Generic change detection
  const lengthIncrease = ((newPrompt.length - originalPrompt.length) / originalPrompt.length) * 100;
  if (lengthIncrease > 10) {
    changes.push(`Expanded prompt by ${Math.round(lengthIncrease)}%`);
  } else if (lengthIncrease < -10) {
    changes.push(`Condensed prompt by ${Math.round(Math.abs(lengthIncrease))}%`);
  }

  return changes.length > 0 ? changes : ['Minor refinements and clarifications'];
}

/**
 * Save prompt variant to database
 */
export async function savePromptVariant(variant: PromptVariant): Promise<string | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('ai_prompt_versions')
      .insert({
        version_name: variant.versionName,
        prompt_text: variant.promptText,
        description: `${variant.description}\n\nChanges:\n${variant.changes.map(c => `- ${c}`).join('\n')}\n\nTargeted Patterns: ${variant.targetedPatterns.join(', ')}`,
        is_active: false, // Variants start inactive
        is_default: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Variant Generation] Error saving variant:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[Variant Generation] Failed to save variant:', error);
    return null;
  }
}

/**
 * Get all prompt versions
 */
export async function getAllPromptVersions(): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_prompt_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Variant Generation] Error fetching versions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active prompt version
 */
export async function getActivePromptVersion(): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_prompt_versions')
    .select('prompt_text')
    .eq('is_default', true)
    .single();

  if (error || !data) {
    // Return base prompt from sustainability-agent.ts if no active version
    return '';
  }

  return data.prompt_text;
}

/**
 * Set a variant as active/default
 */
export async function setActivePromptVersion(versionId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // First, deactivate all current defaults
    await supabase
      .from('ai_prompt_versions')
      .update({ is_default: false, is_active: false })
      .eq('is_default', true);

    // Then activate the new one
    const { error } = await supabase
      .from('ai_prompt_versions')
      .update({ is_default: true, is_active: true })
      .eq('id', versionId);

    if (error) {
      console.error('[Variant Generation] Error setting active version:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Variant Generation] Failed to set active version:', error);
    return false;
  }
}

/**
 * Generate variants for A/B testing
 * Creates multiple variants with different strategies
 */
export async function generateABTestVariants(
  basePrompt: string,
  patterns: Pattern[]
): Promise<PromptVariant[]> {
  const variants: PromptVariant[] = [];

  // Generate one variant per strategy
  const strategies: Array<'conservative' | 'moderate' | 'aggressive'> = [
    'conservative',
    'moderate',
    'aggressive',
  ];

  for (const strategy of strategies) {
    const config: VariantGenerationConfig = {
      basePrompt,
      patterns,
      improvementStrategy: strategy,
      variantCount: 1,
    };

    const strategyVariants = await generatePromptVariants(config);
    variants.push(...strategyVariants);
  }

  return variants;
}
