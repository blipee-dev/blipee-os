/**
 * ML-Powered Conversation API
 *
 * Provides ML-enhanced features for conversations.
 * Part of FASE 3 - Integration & Production Readiness
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MLConversationService } from '@/lib/integrations/ml-conversation-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const feature = searchParams.get('feature'); // 'smart_replies', 'quality_prediction', 'forecast_insights', 'all'

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: conversation_id' },
        { status: 400 }
      );
    }

    // Verify conversation access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id, organization_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user has access to this conversation
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.organization_id !== conversation.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const service = new MLConversationService();

    // Return specific feature or all features
    switch (feature) {
      case 'smart_replies': {
        const smartReplies = await service.generateSmartReplies(conversationId);
        return NextResponse.json({ smartReplies });
      }

      case 'quality_prediction': {
        const qualityPrediction = await service.predictConversationQuality(conversationId);
        return NextResponse.json({ qualityPrediction });
      }

      case 'forecast_insights': {
        const forecastInsights = await service.getForecastInsights(conversationId);
        return NextResponse.json({ forecastInsights });
      }

      case 'all':
      default: {
        const enhancements = await service.enhanceConversation(conversationId);
        return NextResponse.json(enhancements);
      }
    }
  } catch (error) {
    console.error('ML conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
