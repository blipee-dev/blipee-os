/**
 * Prompt Version Tracker
 *
 * Tracks which version of the system prompt was used for each AI response.
 * This enables:
 * - A/B testing of prompt improvements
 * - Linking user feedback to specific prompt versions
 * - Automatic optimization based on feedback metrics
 */

import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Get or create a prompt version for the given prompt text
 *
 * Uses content hash to avoid duplicate versions
 */
export async function getOrCreatePromptVersion(
  promptText: string,
  organizationId: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    // Generate content hash for deduplication
    const contentHash = crypto
      .createHash('sha256')
      .update(promptText)
      .digest('hex')
      .substring(0, 16);

    // Check if this version already exists
    const { data: existingVersion } = await supabase
      .from('ai_prompt_versions')
      .select('id')
      .eq('content_hash', contentHash)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingVersion) {
      return existingVersion.id;
    }

    // Create new version
    const { data: newVersion, error } = await supabase
      .from('ai_prompt_versions')
      .insert({
        organization_id: organizationId,
        prompt_text: promptText,
        content_hash: contentHash,
        version_number: await getNextVersionNumber(supabase, organizationId),
        status: 'active',
        metadata: {
          ...metadata,
          created_at: new Date().toISOString(),
          feedback_metrics: {
            total: 0,
            positive: 0,
            negative: 0,
            satisfaction_rate: 0
          }
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating prompt version:', error);
      return null;
    }

    console.log(`✅ Created new prompt version: ${newVersion.id} (hash: ${contentHash})`);
    return newVersion.id;

  } catch (error) {
    console.error('Error in getOrCreatePromptVersion:', error);
    return null;
  }
}

/**
 * Get the next version number for this organization
 */
async function getNextVersionNumber(
  supabase: any,
  organizationId: string
): Promise<number> {
  const { data } = await supabase
    .from('ai_prompt_versions')
    .select('version_number')
    .eq('organization_id', organizationId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.version_number || 0) + 1;
}

/**
 * Get the active prompt version for A/B testing
 *
 * Implements A/B testing by randomly selecting between active versions
 * based on traffic split configuration
 */
export async function getActivePromptVersion(
  organizationId: string
): Promise<{ id: string; promptText: string } | null> {
  try {
    const supabase = createAdminClient();

    // Get all active versions for this org
    const { data: versions } = await supabase
      .from('ai_prompt_versions')
      .select('id, prompt_text, metadata')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!versions || versions.length === 0) {
      // No active versions - use base prompt
      return null;
    }

    // If only one version, use it
    if (versions.length === 1) {
      return {
        id: versions[0].id,
        promptText: versions[0].prompt_text
      };
    }

    // A/B testing: Select version based on traffic split
    // Default: Equal split between all active versions
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    const equalWeight = 1 / versions.length;

    for (const version of versions) {
      const weight = version.metadata?.traffic_split || equalWeight;
      cumulativeWeight += weight;

      if (randomValue <= cumulativeWeight) {
        return {
          id: version.id,
          promptText: version.prompt_text
        };
      }
    }

    // Fallback to first version
    return {
      id: versions[0].id,
      promptText: versions[0].prompt_text
    };

  } catch (error) {
    console.error('Error getting active prompt version:', error);
    return null;
  }
}

/**
 * Mark a prompt version as deprecated and create a new improved version
 */
export async function deprecateAndReplace(
  oldVersionId: string,
  newPromptText: string,
  organizationId: string,
  reason: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    // Mark old version as deprecated
    await supabase
      .from('ai_prompt_versions')
      .update({
        status: 'deprecated',
        metadata: {
          deprecated_at: new Date().toISOString(),
          deprecated_reason: reason
        }
      })
      .eq('id', oldVersionId);

    // Create new version
    const newVersionId = await getOrCreatePromptVersion(
      newPromptText,
      organizationId,
      {
        parent_version_id: oldVersionId,
        optimization_reason: reason
      }
    );

    console.log(`✅ Deprecated version ${oldVersionId}, created replacement ${newVersionId}`);
    return newVersionId;

  } catch (error) {
    console.error('Error in deprecateAndReplace:', error);
    return null;
  }
}
