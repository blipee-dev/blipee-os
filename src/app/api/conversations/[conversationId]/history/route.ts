/**
 * Conversation History API Endpoint
 * 
 * Provides access to conversation history and memory
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { conversationMemoryManager as conversationMemory } from '@/lib/ai/conversation-memory';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/conversations/[conversationId]/history - Get conversation history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeMemory = searchParams.get('includeMemory') === 'true';

    // Get conversation to verify access
    const { data: conversation, _error: convError } = await supabase
      .from('conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ _error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user has access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .single();

    if (!member) {
      await securityAuditLogger.log({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        _userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resource: `/api/conversations/${conversationId}/history`,
        action: 'get_history',
        result: 'failure',
        details: { conversationId }
      });
      
      return NextResponse.json({ _error: 'Access denied' }, { status: 403 });
    }

    // Get messages
    const { data: messages, _error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgError) {
      throw new Error(`Failed to retrieve messages: ${msgError.message}`);
    }

    let memory = null;
    if (includeMemory) {
      // Retrieve conversation memory
      memory = await conversationMemory.getConversationMemory(conversationId);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    // Log successful access
    await securityAuditLogger.log({
      eventType: SecurityEventType.CONVERSATION_ACCESSED,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: `/api/conversations/${conversationId}/history`,
      action: 'get_history',
      result: 'success',
      details: { 
        conversationId, 
        messageCount: messages?.length || 0,
        includeMemory 
      }
    });

    return NextResponse.json({
      conversationId,
      messages: messages || [],
      memory,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Conversation history _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to retrieve conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/conversations/[conversationId]/history - Clear conversation history
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Get conversation to verify access
    const { data: conversation, _error: convError } = await supabase
      .from('conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ _error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user has admin access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ _error: 'Admin access required' }, { status: 403 });
    }

    // Clear conversation memory
    await conversationMemory.clearMemory(conversationId);

    // Delete messages
    const { _error: deleteError } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (deleteError) {
      throw new Error(`Failed to delete messages: ${deleteError.message}`);
    }

    // Log the action
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATA_DELETION,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: `/api/conversations/${conversationId}/history`,
      action: 'clear_history',
      result: 'success',
      details: { conversationId }
    });

    return NextResponse.json({
      message: 'Conversation history cleared successfully',
      conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Clear history _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to clear conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}