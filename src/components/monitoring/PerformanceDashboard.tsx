"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DashboardData {
  timestamp: string;
  timeRange: string;
  metrics: {
    system: {
      cpu: number;
      memory: number;
      disk: number;
      uptime: number;
    };
    performance: {
      avgResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
      successRate: number;
    };
    cache: {
      hitRate: number;
      size: number;
      evictions: number;
    };
    database: {
      connections: number;
      queryTime: number;
      activeQueries: number;
    };
    ai: {
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
      providerDistribution: Record<string, number>;
    };
  };
  health: any[];
  alerts: any[];
  charts: any;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/monitoring/dashboard?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time monitoring and analytics
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-black/40 backdrop-blur-xl border border-white/[0.05] rounded-lg px-3 py-2 text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-black/40 border-white/[0.05] text-gray-400'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, index) => (
            <Alert key={index} className={`${getSeverityColor(alert.severity)}/10 border-${getSeverityColor(alert.severity)}/20`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">{alert.name}:</span> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">CPU Usage</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {data.metrics.system.cpu.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.metrics.system.cpu} className="h-2" />
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Memory</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {data.metrics.system.memory.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.metrics.system.memory} className="h-2" />
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Disk Usage</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {data.metrics.system.disk.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.metrics.system.disk} className="h-2" />
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Uptime</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {Math.floor(data.metrics.system.uptime / 3600)}h
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(Date.now() - data.metrics.system.uptime * 1000).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Performance</h3>
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Response</span>
              <span className="text-white font-mono">
                {data.metrics.performance.avgResponseTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Requests/sec</span>
              <span className="text-white font-mono">
                {data.metrics.performance.requestsPerSecond.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Error Rate</span>
              <span className={`font-mono ${
                data.metrics.performance.errorRate > 5 ? 'text-red-400' : 'text-green-400'
              }`}>
                {data.metrics.performance.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400 font-mono">
                {data.metrics.performance.successRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Cache</h3>
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Hit Rate</span>
              <span className="text-white font-mono">
                {(data.metrics.cache.hitRate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cache Size</span>
              <span className="text-white font-mono">
                {data.metrics.cache.size}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Evictions</span>
              <span className="text-white font-mono">
                {data.metrics.cache.evictions}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Database</h3>
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Connections</span>
              <span className="text-white font-mono">
                {data.metrics.database.connections}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Query Time</span>
              <span className="text-white font-mono">
                {data.metrics.database.queryTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Queries</span>
              <span className="text-white font-mono">
                {data.metrics.database.activeQueries}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Usage */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI Usage</h3>
          <Shield className="h-5 w-5 text-purple-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Requests</p>
            <p className="text-3xl font-bold text-white">
              {data.metrics.ai.totalRequests.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Tokens Used</p>
            <p className="text-3xl font-bold text-white">
              {data.metrics.ai.totalTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Cost</p>
            <p className="text-3xl font-bold text-white">
              ${data.metrics.ai.totalCost.toFixed(2)}
            </p>
          </div>
        </div>
        {Object.keys(data.metrics.ai.providerDistribution).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-gray-400 text-sm mb-2">Provider Distribution</p>
            <div className="flex gap-2">
              {Object.entries(data.metrics.ai.providerDistribution).map(([provider, count]) => (
                <Badge key={provider} variant="secondary">
                  {provider}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Health Status */}
      {data.health.length > 0 && (
        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Service Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.health.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <span className="text-gray-300">{check.service}</span>
                <div className="flex items-center gap-2">
                  {check.status === 'healthy' ? (
                    <CheckCircle className={`h-4 w-4 ${getHealthColor(check.status)}`} />
                  ) : (
                    <AlertCircle className={`h-4 w-4 ${getHealthColor(check.status)}`} />
                  )}
                  <span className={`text-sm ${getHealthColor(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}