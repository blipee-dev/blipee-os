'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCw, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Shield,
  Target
} from 'lucide-react';

interface AgentStatus {
  agentId: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  autonomyLevel: number;
  healthScore: number;
  lastHeartbeat: string | null;
  statistics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
    averageExecutionTime: number;
  };
  recentTasks: any[];
  pendingApprovals: number;
}

interface AgentDashboardData {
  agents: AgentStatus[];
  total: number;
  active: number;
  paused: number;
  stopped: number;
}

const AgentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) throw new Error('Failed to update agent status');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating agent:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'stopped': return <Square className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'esg_chief_of_staff': return <Brain className="w-6 h-6" />;
      case 'compliance_guardian': return <Shield className="w-6 h-6" />;
      case 'carbon_hunter': return <Target className="w-6 h-6" />;
      case 'supply_chain_investigator': return <TrendingUp className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total}</div>
            <p className="text-xs text-muted-foreground">AI employees active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{dashboardData.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{dashboardData.paused}</div>
            <p className="text-xs text-muted-foreground">Temporarily paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stopped</CardTitle>
            <Square className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{dashboardData.stopped}</div>
            <p className="text-xs text-muted-foreground">Not running</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Autonomous AI Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.agents.map((agent) => (
              <div key={agent.agentId} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAgentIcon(agent.type)}
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={agent.status === 'running' ? 'default' : 'secondary'}>
                      {getStatusIcon(agent.status)}
                      <span className="ml-1 capitalize">{agent.status}</span>
                    </Badge>
                    
                    {agent.pendingApprovals > 0 && (
                      <Badge variant="outline" className="text-orange-500">
                        {agent.pendingApprovals} pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Autonomy Level</div>
                    <div className="text-lg font-semibold">{agent.autonomyLevel}/5</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Health Score</div>
                    <div className="text-lg font-semibold">
                      {(agent.healthScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-lg font-semibold">
                      {(agent.statistics.successRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                    <div className="text-lg font-semibold">{agent.statistics.totalTasks}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAgentAction(agent.agentId, 'start')}
                    disabled={agent.status === 'running'}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAgentAction(agent.agentId, 'pause')}
                    disabled={agent.status === 'stopped'}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAgentAction(agent.agentId, 'stop')}
                    disabled={agent.status === 'stopped'}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAgentAction(agent.agentId, 'restart')}
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    Restart
                  </Button>
                </div>

                {agent.recentTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Tasks</h4>
                    <div className="space-y-1">
                      {agent.recentTasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{task.task_name}</span>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboard;