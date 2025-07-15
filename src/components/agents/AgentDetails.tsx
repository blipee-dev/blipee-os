'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Settings,
  BarChart3,
  Brain,
  Target,
  Eye
} from 'lucide-react';

interface AgentDetailsProps {
  agentId: string;
}

interface AgentDetail {
  agent: any;
  statistics: any;
  recentTasks: any[];
  scheduledTasks: any[];
  pendingApprovals: any[];
  recentDecisions: any[];
  learningPatterns: any[];
  recentMetrics: any[];
}

const AgentDetails = ({ agentId }: AgentDetailsProps) => {
  const [agentData, setAgentData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentDetails();
    const interval = setInterval(fetchAgentDetails, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent details');
      const data = await response.json();
      setAgentData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskExecution = async (taskType: string, taskName: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          taskName,
          priority: 'high'
        })
      });
      
      if (!response.ok) throw new Error('Failed to execute task');
      
      // Refresh agent details
      fetchAgentDetails();
    } catch (err) {
      console.error('Error executing task:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      running: 'bg-green-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      pending: 'bg-yellow-500',
      cancelled: 'bg-gray-500'
    };
    
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
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

  if (!agentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>No data available</div>
      </div>
    );
  }

  const { agent, statistics, recentTasks, scheduledTasks, pendingApprovals, recentDecisions, learningPatterns, recentMetrics } = agentData;

  return (
    <div className="space-y-6">
      {/* Agent Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6" />
            <span>{agent.name}</span>
            {getStatusBadge(agent.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Autonomy Level</div>
              <div className="text-2xl font-bold">{agent.autonomy_level}/5</div>
              <div className="text-xs text-muted-foreground">
                {agent.autonomy_level === 5 ? 'Full autonomy' : 
                 agent.autonomy_level >= 3 ? 'High autonomy' : 
                 'Supervised mode'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Health Score</div>
              <div className="text-2xl font-bold">{(agent.health_score * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">
                {agent.health_score > 0.8 ? 'Excellent' : 
                 agent.health_score > 0.6 ? 'Good' : 
                 agent.health_score > 0.4 ? 'Fair' : 'Poor'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Last Heartbeat</div>
              <div className="text-sm font-medium">
                {agent.last_heartbeat ? formatTimestamp(agent.last_heartbeat) : 'Never'}
              </div>
              <div className="text-xs text-muted-foreground">
                {agent.last_heartbeat ? 'Recently active' : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks executed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {(statistics.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Task completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Execution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statistics.averageExecutionTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Average task time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {pendingApprovals.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Task Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <div className="font-medium">{task.task_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.task_type} • {formatTimestamp(task.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(task.status)}
                      {task.duration_ms && (
                        <span className="text-xs text-muted-foreground">
                          {(task.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <div className="font-medium">{task.task_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.schedule_pattern} • Next: {formatTimestamp(task.next_run)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentDecisions.map((decision, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="font-medium">{decision.decision_type}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Confidence: {(decision.confidence_score * 100).toFixed(0)}% • 
                      Autonomy: {decision.autonomy_level_used}/5 • 
                      {formatTimestamp(decision.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {learningPatterns.map((pattern, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="font-medium">{pattern.pattern_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Success Rate: {(pattern.success_rate * 100).toFixed(1)}% • 
                      Confidence: {(pattern.confidence_score * 100).toFixed(0)}% • 
                      Used: {pattern.usage_count} times
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <div className="font-medium">{metric.metric_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {metric.metric_type} • {formatTimestamp(metric.recorded_at)}
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {metric.metric_value} {metric.metric_unit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleTaskExecution('analyze_metrics', 'Manual ESG Analysis')}
                  className="w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Run ESG Analysis
                </Button>
                
                <Button 
                  onClick={() => handleTaskExecution('generate_report', 'Manual Report Generation')}
                  variant="outline"
                  className="w-full"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                
                <Button 
                  onClick={() => handleTaskExecution('monitor_realtime', 'Manual Real-time Monitor')}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Monitor Real-time
                </Button>
                
                <Button 
                  onClick={() => handleTaskExecution('optimize_operations', 'Manual Optimization')}
                  variant="outline"
                  className="w-full"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Find Optimizations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDetails;