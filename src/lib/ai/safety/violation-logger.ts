/**
 * Content Safety Violation Logger
 *
 * Logs content safety violations to the database for auditing and compliance.
 */

import { createClient } from '@/lib/supabase/server';
import type { SafetyViolation } from './content-safety';

export interface ViolationLogContext {
  conversationId?: string;
  organizationId?: string;
  userId?: string;
  model?: string;
  messageRole?: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
}

/**
 * Map violation type to action taken
 */
function getActionTaken(violationType: SafetyViolation['type']): 'blocked' | 'redacted' | 'logged' {
  switch (violationType) {
    case 'inappropriate':
    case 'custom':
      return 'blocked'; // These stop the stream
    case 'sensitive':
      return 'redacted'; // PII is filtered/redacted
    case 'unprofessional':
      return 'logged'; // Only logged, no action
    default:
      return 'logged';
  }
}

/**
 * Log a content safety violation to the database
 */
export async function logSafetyViolation(
  violation: SafetyViolation,
  context: ViolationLogContext = {}
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('content_safety_violations')
      .insert({
        violation_type: violation.type,
        reason: violation.reason,
        detected_content: violation.detectedContent?.substring(0, 500), // Truncate to 500 chars
        conversation_id: context.conversationId,
        organization_id: context.organizationId,
        user_id: context.userId,
        model: context.model,
        message_role: context.messageRole,
        action_taken: getActionTaken(violation.type),
        metadata: context.metadata || {},
        created_at: violation.timestamp.toISOString()
      });

    if (error) {
      console.error('[Violation Logger] Failed to log violation:', error);
    } else {
      console.log('[Violation Logger] Logged violation:', {
        type: violation.type,
        action: getActionTaken(violation.type),
        conversationId: context.conversationId
      });
    }
  } catch (error) {
    // Don't throw errors from logging - log failures should not break the app
    console.error('[Violation Logger] Exception while logging violation:', error);
  }
}

/**
 * Create a violation callback that logs to the database
 */
export function createDatabaseViolationLogger(
  context: ViolationLogContext
): (violation: SafetyViolation) => void {
  return (violation: SafetyViolation) => {
    // Log to console immediately
    console.warn('[Content Safety Violation]', {
      type: violation.type,
      reason: violation.reason,
      timestamp: violation.timestamp,
      conversationId: context.conversationId
    });

    // Log to database asynchronously (don't await)
    logSafetyViolation(violation, context).catch((error) => {
      console.error('[Violation Logger] Failed to log to database:', error);
    });
  };
}
