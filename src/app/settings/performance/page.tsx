'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Database, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  BarChart3,
  Clock,
  Server
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { requireRole } from '@/lib/auth/require-role';

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    slowRequests: number;
  };
  requests: {
    total: number;
    errorRate: number;
    rpm: number;
  };
  cache: {
    hitRate: number;
    hits: number;
    misses: number;
    memoryUsage: number;
    evictions: number;
  };
  database: {
    connectionPool: {
      totalConnections: number;
      readReplicas: number;
      isHealthy: boolean;
    };
  };
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/monitoring/performance?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    // Require admin role
    requireRole(user, ['account_owner', 'sustainability_manager']);
    
    fetchMetrics();
    
    const interval = autoRefresh ? setInterval(fetchMetrics, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, autoRefresh, user, fetchMetrics]);

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      
      if (response.ok) {
        alert('Cache cleared successfully');
        fetchMetrics();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-500" />
              Performance Monitoring
            </h1>
            <p className="mt-1 text-gray-400">
              Real-time performance metrics and optimization tools
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-green-500' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
            </Button>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="1m">Last 1 minute</option>
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
            </select>
          </div>
        </div>

        {/* Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              {metrics && getHealthIcon(metrics.health.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-2xl font-bold capitalize">
                  {metrics?.health.status || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Uptime</p>
                <p className="text-2xl font-bold">
                  {metrics ? formatUptime(metrics.health.uptime) : '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Memory Usage</p>
                <p className="text-2xl font-bold">
                  {metrics ? formatBytes(metrics.health.memory.heapUsed) : '0 B'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Tabs */}
        <Tabs defaultValue="response" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="response">Response Time</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="response" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Average</p>
                    <p className="text-2xl font-bold">
                      {metrics?.responseTime.average.toFixed(0) || 0}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">P95</p>
                    <p className="text-2xl font-bold">
                      {metrics?.responseTime.p95.toFixed(0) || 0}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">P99</p>
                    <p className="text-2xl font-bold">
                      {metrics?.responseTime.p99.toFixed(0) || 0}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Slow Requests</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {metrics?.responseTime.slowRequests || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Request Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Requests</p>
                    <p className="text-2xl font-bold">
                      {metrics?.requests.total.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Requests/min</p>
                    <p className="text-2xl font-bold">
                      {metrics?.requests.rpm || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Error Rate</p>
                    <p className="text-2xl font-bold text-red-500">
                      {metrics?.requests.errorRate.toFixed(2) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Cache Performance
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCache}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Hit Rate</span>
                    <span className="text-sm font-medium">
                      {metrics?.cache.hitRate.toFixed(1) || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics?.cache.hitRate || 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Hits</p>
                    <p className="text-xl font-bold text-green-500">
                      {metrics?.cache.hits.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Misses</p>
                    <p className="text-xl font-bold text-orange-500">
                      {metrics?.cache.misses.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Memory</p>
                    <p className="text-xl font-bold">
                      {metrics ? formatBytes(metrics.cache.memoryUsage) : '0 B'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Evictions</p>
                    <p className="text-xl font-bold">
                      {metrics?.cache.evictions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Connections</p>
                    <p className="text-2xl font-bold">
                      {metrics?.database.connectionPool.totalConnections || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Read Replicas</p>
                    <p className="text-2xl font-bold">
                      {metrics?.database.connectionPool.readReplicas || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pool Health</p>
                    <p className="text-2xl font-bold">
                      {metrics?.database.connectionPool.isHealthy ? (
                        <span className="text-green-500">Healthy</span>
                      ) : (
                        <span className="text-red-500">Unhealthy</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Optimization Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics?.cache.hitRate && metrics.cache.hitRate < 80 && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <span>Cache hit rate is below 80%. Consider caching more queries.</span>
                </li>
              )}
              {metrics?.responseTime.average && metrics.responseTime.average > 1000 && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <span>Average response time exceeds 1 second. Review slow endpoints.</span>
                </li>
              )}
              {metrics?.requests.errorRate && metrics.requests.errorRate > 1 && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <span>Error rate is above 1%. Investigate failing requests.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Enable auto-refresh to monitor metrics in real-time.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}