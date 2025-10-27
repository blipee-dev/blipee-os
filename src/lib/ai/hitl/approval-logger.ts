/**
 * Tool Approval Logger
 *
 * Logs tool approvals and denials to the database for audit trail and compliance.
 */

import { createClient } from '@/lib/supabase/server';

export interface ToolApprovalContext {
  toolName: string;
  toolCallId: string;
  toolInput: any;
  toolOutput?: any;
  approved: boolean;
  denialReason?: string;
  conversationId?: string;
  organizationId?: string;
  messageId?: string;
  userId: string;
  model?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a tool approval or denial to the database
 */
export async function logToolApproval(context: ToolApprovalContext): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('tool_approvals')
      .insert({
        tool_name: context.toolName,
        tool_call_id: context.toolCallId,
        tool_input: context.toolInput,
        tool_output: context.toolOutput || null,
        approved: context.approved,
        denial_reason: context.denialReason || null,
        approved_by: context.userId,
        conversation_id: context.conversationId,
        organization_id: context.organizationId,
        message_id: context.messageId,
        model: context.model,
        metadata: context.metadata || {},
        approved_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Approval Logger] Failed to log approval:', error);
    } else {
      console.log('[Approval Logger] Logged approval:', {
        tool: context.toolName,
        approved: context.approved,
        userId: context.userId
      });
    }
  } catch (error) {
    // Don't throw errors from logging - log failures should not break the app
    console.error('[Approval Logger] Exception while logging approval:', error);
  }
}

/**
 * Get approval history for a conversation
 */
export async function getConversationApprovals(conversationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tool_approvals')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Approval Logger] Failed to get approvals:', error);
    return [];
  }

  return data;
}

/**
 * Get approval history for an organization
 */
export async function getOrganizationApprovals(
  organizationId: string,
  options?: {
    limit?: number;
    toolName?: string;
    approvedOnly?: boolean;
  }
) {
  const supabase = createClient();

  let query = supabase
    .from('tool_approvals')
    .select('*')
    .eq('organization_id', organizationId);

  if (options?.toolName) {
    query = query.eq('tool_name', options.toolName);
  }

  if (options?.approvedOnly !== undefined) {
    query = query.eq('approved', options.approvedOnly);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[Approval Logger] Failed to get approvals:', error);
    return [];
  }

  return data;
}

/**
 * Get approval statistics for an organization
 */
export async function getApprovalStats(organizationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tool_approvals')
    .select('tool_name, approved')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Approval Logger] Failed to get stats:', error);
    return null;
  }

  // Calculate stats
  const total = data.length;
  const approved = data.filter(a => a.approved).length;
  const denied = total - approved;

  // Group by tool
  const byTool = data.reduce((acc, curr) => {
    if (!acc[curr.tool_name]) {
      acc[curr.tool_name] = { total: 0, approved: 0, denied: 0 };
    }
    acc[curr.tool_name].total++;
    if (curr.approved) {
      acc[curr.tool_name].approved++;
    } else {
      acc[curr.tool_name].denied++;
    }
    return acc;
  }, {} as Record<string, { total: number; approved: number; denied: number }>);

  return {
    total,
    approved,
    denied,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    byTool
  };
}
