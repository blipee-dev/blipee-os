'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Zap, TrendingUp, Users } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details?: any;
}

interface Metrics {
  timestamp: string;
  system: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    nodeVersion: string;
    platform: string;
  };
  application: {
    metrics: {
      requests: {
        total: number;
        success: number;
        failure: number;
        rate: number;
      };
      performance: {
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        errorRate: number;
      };
      security: {
        loginAttempts: number;
        failedLogins: number;
        suspiciousActivities: number;
      };
    };
  };
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/metrics'),
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch monitoring data');
      console.error('Monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'unhealthy':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5" />;
      case 'unhealthy':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading monitoring data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Monitoring</h1>
            <p className="text-gray-400">
              Real-time monitoring and health status of blipee OS
            </p>
          </div>
          <div className="flex gap-4">
            <GradientButton onClick={fetchData} className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Refresh
            </GradientButton>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* System Status Overview */}
        {health && (
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">System Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(health.status)}`}>
                  {getStatusIcon(health.status)}
                  {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{formatUptime(health.uptime)}</div>
                  <div className="text-gray-400 text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{health.summary.healthy}</div>
                  <div className="text-gray-400 text-sm">Healthy Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{health.summary.degraded}</div>
                  <div className="text-gray-400 text-sm">Degraded Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{health.summary.unhealthy}</div>
                  <div className="text-gray-400 text-sm">Unhealthy Services</div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Requests</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white">{metrics.application.metrics.requests.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Success</span>
                    <span className="text-green-400">{metrics.application.metrics.requests.success.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Errors</span>
                    <span className="text-red-400">{metrics.application.metrics.requests.failure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate/min</span>
                    <span className="text-white">{metrics.application.metrics.requests.rate.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-medium text-white">Performance</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Response</span>
                    <span className="text-white">{metrics.application.metrics.performance.avgResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">P95</span>
                    <span className="text-white">{metrics.application.metrics.performance.p95ResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">P99</span>
                    <span className="text-white">{metrics.application.metrics.performance.p99ResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error Rate</span>
                    <span className="text-red-400">{metrics.application.metrics.performance.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Security</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Login Attempts</span>
                    <span className="text-white">{metrics.application.metrics.security.loginAttempts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Failed Logins</span>
                    <span className="text-red-400">{metrics.application.metrics.security.failedLogins.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Suspicious</span>
                    <span className="text-yellow-400">{metrics.application.metrics.security.suspiciousActivities.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">System</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Used</span>
                    <span className="text-white">{formatBytes(metrics.system.memory.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Total</span>
                    <span className="text-white">{formatBytes(metrics.system.memory.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RSS</span>
                    <span className="text-white">{formatBytes(metrics.system.memory.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Node.js</span>
                    <span className="text-white">{metrics.system.nodeVersion}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Health Checks */}
        {health && (
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Health Checks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {health.checks.map((check) => (
                  <div
                    key={check.name}
                    className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white capitalize">{check.name}</span>
                      {getStatusIcon(check.status)}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time</span>
                        <span className="text-white">{check.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Check</span>
                        <span className="text-white">
                          {new Date(check.lastChecked).toLocaleTimeString()}
                        </span>
                      </div>
                      {check.details && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Quick Links */}
        <GlassCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Monitoring Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
              >
                <div className="text-white font-medium">Grafana Dashboard</div>
                <div className="text-gray-400 text-sm">Visual metrics and alerting</div>
              </a>
              <a
                href="http://localhost:9090"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
              >
                <div className="text-white font-medium">Prometheus</div>
                <div className="text-gray-400 text-sm">Metrics collection and queries</div>
              </a>
              <a
                href="http://localhost:9093"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
              >
                <div className="text-white font-medium">AlertManager</div>
                <div className="text-gray-400 text-sm">Alert routing and notifications</div>
              </a>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}