/**
 * Conversation Preferences API Endpoint
 * 
 * Manages user preferences for specific conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { conversationMemoryManager as conversationMemory } from '@/lib/ai/conversation-memory';
import { UserPreferences } from '@/lib/ai/enhanced-service';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/conversations/[conversationId]/preferences - Get conversation preferences
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Get conversation to verify access
    const { data: conversation, _error: convError } = await supabase
      .from('conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user has access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Retrieve conversation memory
    const memory = await conversationMemory.getConversationMemory(conversationId);
    
    if (!memory || !memory.preferences) {
      // Return default preferences
      return NextResponse.json({
        conversationId,
        preferences: {
          communicationStyle: 'professional',
          responseLength: 'detailed',
          domainFocus: ['general_sustainability'],
          language: 'en'
        },
        isDefault: true,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      conversationId,
      preferences: memory.preferences,
      isDefault: false,
      lastUpdated: memory.metadata?.lastActivity || new Date(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json({
      _error: 'Failed to retrieve preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/conversations/[conversationId]/preferences - Update conversation preferences
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const body = await request.json();
    const preferences: UserPreferences = body.preferences;

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
    }

    const validCommunicationStyles = ['formal', 'casual', 'technical'];
    const validResponseLengths = ['brief', 'detailed', 'comprehensive'];

    if (preferences.communicationStyle && !validCommunicationStyles.includes(preferences.communicationStyle)) {
      return NextResponse.json({ 
        _error: `Invalid communication style. Valid values: ${validCommunicationStyles.join(', ')}` 
      }, { status: 400 });
    }

    if (preferences.responseLength && !validResponseLengths.includes(preferences.responseLength)) {
      return NextResponse.json({ 
        _error: `Invalid response length. Valid values: ${validResponseLengths.join(', ')}` 
      }, { status: 400 });
    }

    // Get conversation to verify access
    const { data: conversation, _error: convError } = await supabase
      .from('conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user has access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update preferences in conversation memory
    await conversationMemory.updatePreferences(user.id, preferences);

    // Log the update
    await securityAuditLogger.log({
      eventType: SecurityEventType.SETTINGS_CHANGED,
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: `/api/conversations/${conversationId}/preferences`,
      action: 'update_preferences',
      result: 'success',
      details: { conversationId, preferences }
    });

    return NextResponse.json({
      message: 'Preferences updated successfully',
      conversationId,
      preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json({
      _error: 'Failed to update preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}