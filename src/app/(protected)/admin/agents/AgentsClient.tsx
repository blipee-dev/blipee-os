'use client';

/**
 * Agent Activity Dashboard
 *
 * Visualizes proactive agent behavior, performance metrics, and insights
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, TrendingUp, MessageSquare, Users, RefreshCw } from 'lucide-react';

interface AgentHealth {
  agent_id: string;
  agent_name: string;
  status: 'active' | 'warning' | 'inactive';
  messages_sent: number;
  response_rate: number;
  triggers_last_7d: number;
}

interface DashboardData {
  timeframe: {
    days: number;
    start_date: string;
  };
  summary: {
    total_messages: number;
    avg_response_rate: number;
    active_agents: number;
    total_triggers: number;
  };
  metrics: {
    messages_by_agent: Record<string, number>;
    response_rates: Array<{
      agent: string;
      rate: number;
      sent: number;
      responded: number;
    }>;
    trigger_frequency: Record<string, number>;
    satisfaction: Array<{
      agent: string;
      score: number;
      total: number;
    }>;
    agent_health: AgentHealth[];
  };
  recent_activity: any[];
}

export default function AgentsClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState(30);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/agent-activity?days=${timeframe}`);

      if (!response.ok) {
        throw new Error('Failed to fetch agent activity data');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Activity Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor proactive agent performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_messages}</div>
            <p className="text-xs text-muted-foreground">Sent by all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avg_response_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">User engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.active_agents} / 8
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_triggers}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.metrics.agent_health.map((agent) => (
              <div
                key={agent.agent_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold">{agent.agent_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.agent_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {agent.messages_sent} messages
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {agent.response_rate.toFixed(1)}% response rate
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {agent.triggers_last_7d} triggers
                    </div>
                    <div className="text-xs text-muted-foreground">Last 7 days</div>
                  </div>

                  <Badge
                    variant={
                      agent.status === 'active'
                        ? 'default'
                        : agent.status === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages by Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages Sent by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.metrics.messages_by_agent)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([agent, count]) => (
                  <div key={agent} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatAgentName(agent)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${((count as number) / data.summary.total_messages) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{count as number}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Rates by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.metrics.response_rates
                .sort((a, b) => b.rate - a.rate)
                .map((item) => (
                  <div key={item.agent} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatAgentName(item.agent)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-16 text-right">
                        {item.rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recent_activity.slice(0, 10).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <span className="font-medium">{formatAgentName(activity.agent_name)}</span>
                  <span className="text-muted-foreground ml-2">{activity.activity_type}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  return names[agentId] || agentId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
