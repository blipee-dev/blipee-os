/**
 * Agent-Conversation Integration API
 *
 * Provides endpoints for accessing combined agent and conversation analytics.
 * Part of FASE 3 - Integration & Production Readiness
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AgentConversationIntegrationService } from '@/lib/integrations/agent-conversation-integration';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const daysBack = parseInt(searchParams.get('days_back') || '30');

    const service = new AgentConversationIntegrationService();

    // Get specific conversation details
    if (conversationId) {
      const details = await service.getAgentConversationDetails(conversationId);
      if (!details) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(details);
    }

    // Get overall metrics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const metrics = await service.getAgentConversationMetrics(
      profile.organization_id,
      startDate,
      endDate
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Agent conversation integration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
