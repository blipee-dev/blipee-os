'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Key, Phone, HelpCircle, Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { RecoveryStats, RecoveryMethod, RecoveryStatus } from '@/lib/auth/recovery/types';

interface RecoveryDashboardProps {
  organizationId?: string;
}

export function RecoveryDashboard({ organizationId }: RecoveryDashboardProps) {
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecoveryStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (organizationId) {
        params.set('organizationId', organizationId);
      }

      const response = await fetch(`/api/auth/recovery/stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recovery stats:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRecoveryStats();
  }, [fetchRecoveryStats]);

  const getMethodIcon = (method: RecoveryMethod) => {
    switch (method) {
      case RecoveryMethod.EMAIL:
        return <Key className="h-4 w-4" />;
      case RecoveryMethod.SMS:
        return <Phone className="h-4 w-4" />;
      case RecoveryMethod.SECURITY_QUESTIONS:
        return <HelpCircle className="h-4 w-4" />;
      case RecoveryMethod.BACKUP_CODES:
        return <Shield className="h-4 w-4" />;
      case RecoveryMethod.ADMIN_OVERRIDE:
        return <Users className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: RecoveryStatus) => {
    switch (status) {
      case RecoveryStatus.VERIFIED:
      case RecoveryStatus.USED:
        return 'text-green-600 dark:text-green-400';
      case RecoveryStatus.FAILED:
      case RecoveryStatus.EXPIRED:
        return 'text-red-600 dark:text-red-400';
      case RecoveryStatus.PENDING:
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: RecoveryStatus) => {
    switch (status) {
      case RecoveryStatus.VERIFIED:
      case RecoveryStatus.USED:
        return <CheckCircle className="h-4 w-4" />;
      case RecoveryStatus.FAILED:
      case RecoveryStatus.EXPIRED:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading recovery statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load recovery statistics</p>
      </div>
    );
  }

  const successRate = stats.totalRequests > 0 
    ? (stats.successfulRecoveries / stats.totalRequests) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</h3>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRequests}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 days</p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</h3>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{successRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.successfulRecoveries} successful
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Attempts</h3>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failedAttempts}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.expiredTokens} expired tokens
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Most Used Method</h3>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Object.entries(stats.methodBreakdown)
              .sort(([,a], [,b]) => b - a)[0]?.[0]
              ?.replace('_', ' ')
              ?.toUpperCase() || 'N/A'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Primary method</p>
        </div>
      </div>

      {/* Method Breakdown */}
      <GlassCard>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recovery Methods Usage
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.methodBreakdown).map(([method, count]) => {
              const percentage = stats.totalRequests > 0 ? (count / stats.totalRequests) * 100 : 0;
              
              return (
                <div key={method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(method as RecoveryMethod)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {method.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Recent Recovery Requests */}
      <GlassCard>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Recovery Requests
          </h3>
          {stats.recentRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent recovery requests</p>
          ) : (
            <div className="space-y-3">
              {stats.recentRequests.map((request, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(request.method)}
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.email}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{request.method.replace('_', ' ')}</span>
                        <span>{request.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(request.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Security Alerts */}
      {stats.failedAttempts > 10 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              High number of failed recovery attempts
            </p>
            <p className="text-amber-800 dark:text-amber-200">
              {stats.failedAttempts} failed attempts detected in the last 30 days. 
              Consider reviewing security policies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}