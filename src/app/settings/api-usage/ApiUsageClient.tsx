'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { Activity, TrendingUp, Clock, AlertTriangle, Calendar, BarChart3, Zap, Globe } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface UsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  apiKeysActive: number;
  quotaUsage: number;
  quotaLimit: number;
  topEndpoints: Array<{
    path: string;
    method: string;
    count: number;
    avgResponseTime: number;
  }>;
  requestsOverTime: Array<{
    timestamp: string;
    requests: number;
    errors: number;
  }>;
  responseTimeDistribution: Array<{
    range: string;
    count: number;
  }>;
  statusCodeDistribution: Array<{
    code: string;
    count: number;
  }>;
}

export default function ApiUsageClient() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedKey, setSelectedKey] = useState<string>('all');
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [timeRange, selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAPIKeys = async () => {
    try {
      const response = await fetch('/api/gateway/keys');
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.keys.filter((key: any) => key.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        apiKey: selectedKey,
      });

      const response = await fetch(`/api/gateway/usage?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return '';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 accent-border"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6">
        <GlassCard>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Usage Data</h3>
            <p className="text-gray-400">
              Usage metrics will appear here once API calls are made
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
                <Activity className="h-8 w-8 accent-text" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-white">API Usage Analytics</h1>
                <p className="mt-1 text-gray-400">
                  Monitor API performance and usage patterns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* API Key Filter */}
              <CustomDropdown
                value={selectedKey}
                onChange={(value) => setSelectedKey(value as string)}
                options={[
                  { value: "all", label: "All API Keys" },
                  ...apiKeys.map((key) => ({
                    value: key.id,
                    label: key.name
                  }))
                ]}
              />

              {/* Time Range Selector */}
              <CustomDropdown
                value={timeRange}
                onChange={(value) => setTimeRange(value as '24h' | '7d' | '30d')}
                options={[
                  { value: "24h", label: "24 Hours" },
                  { value: "7d", label: "7 Days" },
                  { value: "30d", label: "30 Days" }
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(metrics.totalRequests)}
                </p>
                <p className="text-sm text-gray-500 mt-2">{getTimeRangeLabel()}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-white">
                  {metrics.totalRequests > 0
                    ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
                <p className="text-sm text-green-500 mt-2">
                  {formatNumber(metrics.successfulRequests)} successful
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Avg Response Time</p>
                <p className="text-3xl font-bold text-white">
                  {metrics.averageResponseTime.toFixed(0)}ms
                </p>
                <p className="text-sm text-gray-500 mt-2">Median response time</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Quota Usage</p>
                <p className="text-3xl font-bold text-white">
                  {((metrics.quotaUsage / metrics.quotaLimit) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {formatNumber(metrics.quotaUsage)} / {formatNumber(metrics.quotaLimit)}
                </p>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Volume Over Time */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Request Volume
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.requestsOverTime}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#666"
                    tick={{ fill: '#888' }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm')}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    name="Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorErrors)"
                    name="Errors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Response Time Distribution */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Response Time Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="range"
                    stroke="#666"
                    tick={{ fill: '#888' }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Code Distribution */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Status Codes
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusCodeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ code, percent }) => `${code} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.statusCodeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Top Endpoints */}
          <GlassCard className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-400" />
              Top Endpoints
            </h3>
            <div className="space-y-3">
              {metrics.topEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                      endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="text-sm text-gray-300 font-mono">{endpoint.path}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-400">
                      {formatNumber(endpoint.count)} requests
                    </span>
                    <span className="text-gray-500">
                      {endpoint.avgResponseTime.toFixed(0)}ms avg
                    </span>
                  </div>
                </div>
              ))}
              {metrics.topEndpoints.length === 0 && (
                <p className="text-center text-gray-500 py-8">No endpoint data available</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Rate Limit Warning */}
        {metrics.quotaUsage / metrics.quotaLimit > 0.8 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="border-yellow-500/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-400">Approaching Quota Limit</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    You{"'"}ve used {((metrics.quotaUsage / metrics.quotaLimit) * 100).toFixed(0)}% of your API quota.
                    Consider upgrading your plan for higher limits.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}