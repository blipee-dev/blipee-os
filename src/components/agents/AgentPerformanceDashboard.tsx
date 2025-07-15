'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap,
  Target,
  MessageSquare,
  GitBranch,
  BarChart3,
  Clock,
  Award,
  Info
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: string;
  accuracy: number;
  responseTime: number;
  successRate: number;
  tasksCompleted: number;
}

interface LearningProgress {
  agent: string;
  baseline: number;
  current: number;
  improvement: number;
  trend: 'up' | 'down' | 'stable';
}

interface CollaborationMetric {
  fromAgent: string;
  toAgent: string;
  messageCount: number;
  insightQuality: number;
}

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  agent: string;
  message: string;
  timestamp: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AgentPerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  
  // Mock data - in production, this would come from API
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [learningData, setLearningData] = useState<LearningProgress[]>([]);
  const [collaborationData, setCollaborationData] = useState<CollaborationMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      loadMockData();
      setLoading(false);
    }, 1000);

    // Set up real-time updates
    const interval = setInterval(updateRealTimeData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMockData = () => {
    // Generate performance timeline data
    const now = new Date();
    const perfData: PerformanceMetric[] = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      perfData.push({
        timestamp: time.toISOString(),
        accuracy: 88 + Math.random() * 8,
        responseTime: 200 + Math.random() * 100,
        successRate: 90 + Math.random() * 8,
        tasksCompleted: Math.floor(150 + Math.random() * 50)
      });
    }
    setPerformanceData(perfData);

    // Learning progress data
    setLearningData([
      { agent: 'Carbon Hunter', baseline: 72, current: 94, improvement: 22, trend: 'up' },
      { agent: 'Compliance Guardian', baseline: 85, current: 98, improvement: 13, trend: 'up' },
      { agent: 'Supply Chain Investigator', baseline: 68, current: 89, improvement: 21, trend: 'up' },
      { agent: 'ESG Chief of Staff', baseline: 75, current: 91, improvement: 16, trend: 'up' }
    ]);

    // Collaboration network data
    setCollaborationData([
      { fromAgent: 'Carbon Hunter', toAgent: 'Compliance Guardian', messageCount: 156, insightQuality: 0.92 },
      { fromAgent: 'Carbon Hunter', toAgent: 'ESG Chief', messageCount: 203, insightQuality: 0.88 },
      { fromAgent: 'Compliance Guardian', toAgent: 'ESG Chief', messageCount: 187, insightQuality: 0.95 },
      { fromAgent: 'Supply Chain Investigator', toAgent: 'Carbon Hunter', messageCount: 142, insightQuality: 0.87 },
      { fromAgent: 'Supply Chain Investigator', toAgent: 'ESG Chief', messageCount: 178, insightQuality: 0.90 },
      { fromAgent: 'ESG Chief', toAgent: 'All Agents', messageCount: 245, insightQuality: 0.93 }
    ]);

    // System alerts
    setAlerts([
      {
        id: '1',
        severity: 'info',
        agent: 'Carbon Hunter',
        message: 'Detected 15% reduction in emissions after HVAC optimization',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        severity: 'warning',
        agent: 'Supply Chain Investigator',
        message: 'Supplier risk score increased for 2 vendors',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        severity: 'info',
        agent: 'Compliance Guardian',
        message: 'Q1 GRI report preparation started (45 days until deadline)',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ]);
  };

  const updateRealTimeData = () => {
    // Simulate real-time updates
    setPerformanceData(prev => {
      const newData = [...prev.slice(1)];
      const lastMetric = prev[prev.length - 1];
      newData.push({
        timestamp: new Date().toISOString(),
        accuracy: Math.max(85, Math.min(99, lastMetric.accuracy + (Math.random() - 0.5) * 2)),
        responseTime: Math.max(150, Math.min(350, lastMetric.responseTime + (Math.random() - 0.5) * 20)),
        successRate: Math.max(85, Math.min(99, lastMetric.successRate + (Math.random() - 0.5) * 2)),
        tasksCompleted: Math.floor(150 + Math.random() * 50)
      });
      return newData;
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate aggregate metrics
  const latestMetrics = performanceData[performanceData.length - 1];
  const avgAccuracy = performanceData.reduce((sum, m) => sum + m.accuracy, 0) / performanceData.length;
  const avgResponseTime = performanceData.reduce((sum, m) => sum + m.responseTime, 0) / performanceData.length;
  const totalTasks = performanceData.reduce((sum, m) => sum + m.tasksCompleted, 0);

  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics.accuracy.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +2.3% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics.responseTime.toFixed(0)}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              -15ms improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics.successRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 text-blue-500 mr-1" />
              Stable performance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-yellow-500 mr-1" />
              4,000+ decisions/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter(a => a.severity !== 'info').length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3 text-orange-500 mr-1" />
              {alerts.length} total notifications
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => formatTime(value as string)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      name="Accuracy %"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="Success Rate %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Accuracy', value: 94, fullMark: 100 },
                    { metric: 'Speed', value: 88, fullMark: 100 },
                    { metric: 'Learning', value: 92, fullMark: 100 },
                    { metric: 'Collaboration', value: 87, fullMark: 100 },
                    { metric: 'Autonomy', value: 95, fullMark: 100 },
                    { metric: 'Reliability', value: 98, fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="System Performance" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {learningData.map((agent, idx) => (
              <Card key={agent.agent}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{agent.agent}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Performance</span>
                      <span className="text-sm font-semibold">{agent.current}%</span>
                    </div>
                    <Progress value={agent.current} className="h-2" />
                    <div className="flex items-center text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      +{agent.improvement}% improvement
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip labelFormatter={(value) => formatTime(value as string)} />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    name="Accuracy %"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#3b82f6" 
                    name="Success Rate %"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#f59e0b" 
                    name="Response Time (ms)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => formatTime(value as string)} />
                    <Bar dataKey="tasksCompleted" fill="#8b5cf6" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '<200ms', value: 45, fill: '#10b981' },
                        { name: '200-300ms', value: 35, fill: '#3b82f6' },
                        { name: '300-400ms', value: 15, fill: '#f59e0b' },
                        { name: '>400ms', value: 5, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningData.map((agent) => (
                  <div key={agent.agent} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{agent.agent}</h4>
                      <Badge variant="outline" className="text-green-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{agent.improvement}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Baseline:</span>
                        <span className="ml-2 font-medium">{agent.baseline}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <span className="ml-2 font-medium">{agent.current}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <span className="ml-2 font-medium">95%</span>
                      </div>
                    </div>
                    <Progress value={(agent.current - agent.baseline) / (95 - agent.baseline) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Algorithm Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Neural Pattern Recognition</span>
                    <span className="text-sm font-semibold text-green-500">92% accuracy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Q-Learning Convergence</span>
                    <span className="text-sm font-semibold text-green-500">250 episodes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transfer Learning</span>
                    <span className="text-sm font-semibold text-green-500">87% applicability</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Federated Learning Network</span>
                    <span className="text-sm font-semibold text-green-500">47 organizations</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temporal Prediction</span>
                    <span className="text-sm font-semibold text-green-500">88% accuracy</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Transfer Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div></div>
                    <div className="text-center font-medium">To Agent</div>
                    <div className="text-center font-medium">Success Rate</div>
                  </div>
                  {[
                    { from: 'Carbon Hunter', to: 'Supply Chain', rate: 85 },
                    { from: 'Supply Chain', to: 'Carbon Hunter', rate: 90 },
                    { from: 'Compliance', to: 'ESG Chief', rate: 95 },
                    { from: 'ESG Chief', to: 'All Agents', rate: 91 }
                  ].map((transfer, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                      <div className="truncate">{transfer.from}</div>
                      <div className="text-center">→ {transfer.to}</div>
                      <div className="text-center font-medium text-green-500">{transfer.rate}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Collaboration Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborationData.map((collab, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">
                          {collab.fromAgent} → {collab.toAgent}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {collab.messageCount} messages exchanged
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {(collab.insightQuality * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Insight Quality
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency Response Time</span>
                    <Badge className="bg-green-500">&lt; 2 min</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consensus Achievement</span>
                    <Badge className="bg-blue-500">87%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Completion</span>
                    <Badge className="bg-purple-500">95%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cross-Agent Insights</span>
                    <Badge className="bg-orange-500">156/day</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: 'Carbon Spike Response', status: 'active', progress: 75 },
                    { name: 'Monthly ESG Review', status: 'scheduled', progress: 0 },
                    { name: 'Supplier Risk Assessment', status: 'active', progress: 45 },
                    { name: 'Compliance Check', status: 'completed', progress: 100 }
                  ].map((workflow, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>{workflow.name}</span>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <Progress value={workflow.progress} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`
                    p-4 rounded-lg border ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 
                    alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 
                    'border-green-500 bg-green-50 dark:bg-green-900/10'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {alert.agent}
                        </div>
                        <div className="text-sm">
                          {alert.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Alerts (24h)</span>
                    <span className="text-sm font-semibold text-red-500">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Warnings (24h)</span>
                    <span className="text-sm font-semibold text-yellow-500">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Info Messages (24h)</span>
                    <span className="text-sm font-semibold text-green-500">15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="text-sm font-semibold">&lt; 5 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { icon: Award, text: '15% emission reduction detected', time: '2h ago' },
                    { icon: Target, text: '98% compliance rate achieved', time: '5h ago' },
                    { icon: TrendingUp, text: '3 new optimization opportunities', time: '8h ago' },
                    { icon: GitBranch, text: 'Knowledge transfer completed', time: '12h ago' }
                  ].map((achievement, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm">
                      <achievement.icon className="h-4 w-4 text-green-500" />
                      <div className="flex-1">{achievement.text}</div>
                      <div className="text-xs text-muted-foreground">{achievement.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentPerformanceDashboard;