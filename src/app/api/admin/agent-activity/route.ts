/**
 * Agent Activity Dashboard API
 *
 * Provides metrics and insights about proactive agent performance
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const organizationId = orgMember.organization_id;

    // Get timeframe from query params (default: last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get('days') || '30');
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // ============================================
    // 1. AGENT MESSAGES SENT (by agent)
    // ============================================
    const { data: messagesByAgent } = await supabase
      .from('messages')
      .select('agent_id, created_at')
      .eq('role', 'agent')
      .gte('created_at', startDate)
      .not('agent_id', 'is', null);

    const agentMessageCounts = (messagesByAgent || []).reduce((acc: any, msg: any) => {
      const agent = msg.agent_id || 'unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {});

    // ============================================
    // 2. USER RESPONSE RATES (by agent)
    // ============================================
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, metadata')
      .eq('type', 'agent_proactive')
      .gte('created_at', startDate);

    const responseRates: Record<string, { sent: number; responded: number }> = {};

    for (const conv of conversations || []) {
      const agentId = conv.metadata?.agent_id || 'unknown';
      if (!responseRates[agentId]) {
        responseRates[agentId] = { sent: 0, responded: 0 };
      }

      // Check if user responded (has any user messages)
      const { data: userMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conv.id)
        .eq('role', 'user')
        .limit(1);

      responseRates[agentId].sent++;
      if (userMessages && userMessages.length > 0) {
        responseRates[agentId].responded++;
      }
    }

    const responseRatesByAgent = Object.entries(responseRates).map(([agent, data]) => ({
      agent,
      rate: data.sent > 0 ? (data.responded / data.sent) * 100 : 0,
      sent: data.sent,
      responded: data.responded,
    }));

    // ============================================
    // 3. TRIGGER FREQUENCIES (last 7 days)
    // ============================================
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentActivity } = await supabase
      .from('agent_activity_logs')
      .select('agent_name, activity_type, created_at')
      .eq('activity_type', 'proactive_message')
      .gte('created_at', sevenDaysAgo);

    const triggerFrequency = (recentActivity || []).reduce((acc: any, log: any) => {
      const agent = log.agent_name || 'unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {});

    // ============================================
    // 4. SATISFACTION SCORES (feedback from conversations)
    // ============================================
    const { data: feedback } = await supabase
      .from('conversation_feedback')
      .select('conversation_id, rating, feedback_type')
      .gte('created_at', startDate);

    // Map feedback to agents via conversations
    const satisfactionScores: Record<string, { total: number; positive: number }> = {};

    for (const fb of feedback || []) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', fb.conversation_id)
        .single();

      if (conv && conv.metadata?.agent_id) {
        const agentId = conv.metadata.agent_id;
        if (!satisfactionScores[agentId]) {
          satisfactionScores[agentId] = { total: 0, positive: 0 };
        }
        satisfactionScores[agentId].total++;
        if (fb.rating >= 4 || fb.feedback_type === 'positive') {
          satisfactionScores[agentId].positive++;
        }
      }
    }

    const satisfactionByAgent = Object.entries(satisfactionScores).map(([agent, data]) => ({
      agent,
      score: data.total > 0 ? (data.positive / data.total) * 100 : 0,
      total: data.total,
    }));

    // ============================================
    // 5. RECENT AGENT ACTIVITY (last 20 actions)
    // ============================================
    const { data: recentActions } = await supabase
      .from('agent_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // ============================================
    // 6. AGENT HEALTH STATUS
    // ============================================
    const agentList = [
      'carbon_hunter',
      'compliance_guardian',
      'cost_saving_finder',
      'predictive_maintenance',
      'supply_chain_investigator',
      'regulatory_foresight',
      'esg_chief_of_staff',
      'autonomous_optimizer',
    ];

    const agentHealth = agentList.map((agentId) => {
      const messageCount = agentMessageCounts[agentId] || 0;
      const triggers = triggerFrequency[agentId] || 0;
      const responseData = responseRates[agentId] || { sent: 0, responded: 0 };
      const responseRate = responseData.sent > 0 ? (responseData.responded / responseData.sent) * 100 : 0;

      // Determine health status
      let status: 'active' | 'warning' | 'inactive';
      if (messageCount > 5 && responseRate > 30) {
        status = 'active';
      } else if (messageCount > 0 || triggers > 0) {
        status = 'warning';
      } else {
        status = 'inactive';
      }

      return {
        agent_id: agentId,
        agent_name: formatAgentName(agentId),
        status,
        messages_sent: messageCount,
        response_rate: responseRate,
        triggers_last_7d: triggers,
      };
    });

    // ============================================
    // RETURN ALL METRICS
    // ============================================
    return NextResponse.json({
      timeframe: { days: daysBack, start_date: startDate },
      summary: {
        total_messages: Object.values(agentMessageCounts).reduce((sum: number, count: any) => sum + count, 0),
        avg_response_rate: responseRatesByAgent.length > 0
          ? responseRatesByAgent.reduce((sum, r) => sum + r.rate, 0) / responseRatesByAgent.length
          : 0,
        active_agents: agentHealth.filter(a => a.status === 'active').length,
        total_triggers: Object.values(triggerFrequency).reduce((sum: number, count: any) => sum + count, 0),
      },
      metrics: {
        messages_by_agent: agentMessageCounts,
        response_rates: responseRatesByAgent,
        trigger_frequency: triggerFrequency,
        satisfaction: satisfactionByAgent,
        agent_health: agentHealth,
      },
      recent_activity: recentActions,
    });
  } catch (error: any) {
    console.error('❌ Agent activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Format agent ID to display name
 */
function formatAgentName(agentId: string): string {
  const names: Record<string, string> = {
    carbon_hunter: 'Carbon Hunter',
    compliance_guardian: 'Compliance Guardian',
    cost_saving_finder: 'Cost Saving Finder',
    predictive_maintenance: 'Predictive Maintenance',
    supply_chain_investigator: 'Supply Chain Investigator',
    regulatory_foresight: 'Regulatory Foresight',
    esg_chief_of_staff: 'ESG Chief of Staff',
    autonomous_optimizer: 'Autonomous Optimizer',
  };
  return names[agentId] || agentId;
}
