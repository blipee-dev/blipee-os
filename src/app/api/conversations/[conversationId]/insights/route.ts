/**
 * Conversation Insights API Endpoint
 * 
 * Provides analytics and insights about conversation patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { conversationMemoryManager as conversationMemory } from '@/lib/ai/conversation-memory';
import { metrics } from '@/lib/monitoring/metrics';

interface ConversationInsights {
  topics: Array<{ topic: string; frequency: number; lastMentioned: string }>;
  sentiment: {
    overall: number;
    trend: 'improving' | 'stable' | 'declining';
    distribution: { positive: number; neutral: number; negative: number };
  };
  sustainability: {
    focusAreas: string[];
    complianceTopics: string[];
    actionItems: Array<{ item: string; status: string; created: string }>;
  };
  engagement: {
    messageCount: number;
    averageResponseTime: number;
    sessionCount: number;
    lastActive: string;
  };
  recommendations: string[];
}

/**
 * GET /api/conversations/[conversationId]/insights - Get conversation insights
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30d';

    // Get conversation to verify access
    const { data: conversation, _error: convError } = await supabase
      .from('conversations')
      .select('organization_id, created_at')
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

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate.setTime(new Date(conversation.created_at).getTime());
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get conversation messages in timeframe
    const { data: messages, _error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error(`Failed to retrieve messages: ${msgError.message}`);
    }

    // Get conversation memory
    const memory = await conversationMemory.getConversationMemory(conversationId);

    // Analyze conversation patterns
    const insights = await analyzeConversation(messages || [], memory);

    // Record metrics
    metrics.incrementCounter('conversation_insights_generated', 1, {
      conversation_id: conversationId,
      timeframe
    });

    return NextResponse.json({
      conversationId,
      timeframe: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json({
      _error: 'Failed to generate conversation insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Analyze conversation messages to extract insights
 */
async function analyzeConversation(
  messages: any[],
  memory: any
): Promise<ConversationInsights> {
  // Extract topics from messages and memory
  const topicFrequency = new Map<string, { count: number; lastSeen: Date }>();
  
  messages.forEach(msg => {
    if (msg.metadata?.topics) {
      msg.metadata.topics.forEach((topic: string) => {
        const existing = topicFrequency.get(topic);
        topicFrequency.set(topic, {
          count: (existing?.count || 0) + 1,
          lastSeen: new Date(msg.created_at)
        });
      });
    }
  });

  // Include entities from memory
  if (memory?.entities) {
    memory.entities.forEach((entity: any) => {
      const existing = topicFrequency.get(entity.name);
      topicFrequency.set(entity.name, {
        count: (existing?.count || 0) + entity.frequency,
        lastSeen: new Date(entity.lastMentioned)
      });
    });
  }

  // Sort topics by frequency
  const topics = Array.from(topicFrequency.entries())
    .map(([topic, data]) => ({
      topic,
      frequency: data.count,
      lastMentioned: data.lastSeen.toISOString()
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Analyze sentiment
  const sentiments = messages
    .filter(msg => msg.metadata?.sentiment)
    .map(msg => msg.metadata.sentiment);
  
  const sentimentAvg = sentiments.length > 0
    ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
    : 0;

  const sentimentDistribution = {
    positive: sentiments.filter(s => s > 0.3).length,
    neutral: sentiments.filter(s => s >= -0.3 && s <= 0.3).length,
    negative: sentiments.filter(s => s < -0.3).length
  };

  // Determine sentiment trend
  const recentSentiments = sentiments.slice(-10);
  const olderSentiments = sentiments.slice(0, -10);
  const recentAvg = recentSentiments.length > 0
    ? recentSentiments.reduce((sum, s) => sum + s, 0) / recentSentiments.length
    : 0;
  const olderAvg = olderSentiments.length > 0
    ? olderSentiments.reduce((sum, s) => sum + s, 0) / olderSentiments.length
    : 0;

  let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentAvg > olderAvg + 0.1) sentimentTrend = 'improving';
  else if (recentAvg < olderAvg - 0.1) sentimentTrend = 'declining';

  // Extract sustainability focus areas
  const sustainabilityTopics = new Set<string>();
  const complianceTopics = new Set<string>();
  const actionItems: any[] = [];

  messages.forEach(msg => {
    if (msg.metadata?.sustainability) {
      msg.metadata.sustainability.insights?.forEach((insight: string) => {
        // Simple keyword extraction
        if (insight.toLowerCase().includes('emission') || insight.toLowerCase().includes('carbon')) {
          sustainabilityTopics.add('Carbon Management');
        }
        if (insight.toLowerCase().includes('energy')) {
          sustainabilityTopics.add('Energy Efficiency');
        }
        if (insight.toLowerCase().includes('waste')) {
          sustainabilityTopics.add('Waste Management');
        }
        if (insight.toLowerCase().includes('water')) {
          sustainabilityTopics.add('Water Conservation');
        }
      });

      // Extract compliance topics
      if (msg.content.toLowerCase().includes('gri')) complianceTopics.add('GRI Standards');
      if (msg.content.toLowerCase().includes('cdp')) complianceTopics.add('CDP Reporting');
      if (msg.content.toLowerCase().includes('tcfd')) complianceTopics.add('TCFD Disclosure');
      if (msg.content.toLowerCase().includes('sbti')) complianceTopics.add('Science-Based Targets');
    }

    // Extract action items from recommendations
    if (msg.metadata?.sustainability?.recommendations) {
      msg.metadata.sustainability.recommendations.forEach((rec: string) => {
        actionItems.push({
          item: rec,
          status: 'pending',
          created: msg.created_at
        });
      });
    }
  });

  // Calculate engagement metrics
  const _userMessages = messages.filter(msg => msg.role === 'user');
  const _assistantMessages = messages.filter(msg => msg.role === 'assistant');

  // Estimate response times
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const responseTime = new Date(messages[i + 1].created_at).getTime() - 
                         new Date(messages[i].created_at).getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Generate recommendations based on insights
  const recommendations: string[] = [];

  if (topics.length === 0) {
    recommendations.push('Engage more with specific sustainability topics to get targeted insights');
  }

  if (sustainabilityTopics.size < 3) {
    recommendations.push('Explore more sustainability dimensions like waste, water, or supply chain');
  }

  if (complianceTopics.size === 0) {
    recommendations.push('Consider aligning with reporting standards like GRI, CDP, or TCFD');
  }

  if (sentimentAvg < 0) {
    recommendations.push('Focus on positive progress and celebrate sustainability wins');
  }

  if (actionItems.length > 5) {
    recommendations.push('Prioritize your action items and track completion progress');
  }

  return {
    topics,
    sentiment: {
      overall: sentimentAvg,
      trend: sentimentTrend,
      distribution: sentimentDistribution
    },
    sustainability: {
      focusAreas: Array.from(sustainabilityTopics),
      complianceTopics: Array.from(complianceTopics),
      actionItems: actionItems.slice(0, 10)
    },
    engagement: {
      messageCount: messages.length,
      averageResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
      sessionCount: memory?.sessionCount || 1,
      lastActive: messages.length > 0 ? messages[messages.length - 1].created_at : new Date().toISOString()
    },
    recommendations
  };
}