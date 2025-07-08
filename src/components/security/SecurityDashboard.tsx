'use client';

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Users } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';

interface SecurityStats {
  rateLimit: {
    totalRequests: number;
    blockedRequests: number;
    topOffenders: Array<{ ip: string; count: number }>;
  };
  ddos: {
    totalConnections: number;
    blacklistedIPs: number;
    whitelistedIPs: number;
    suspiciousIPs: number;
  };
  sessions: {
    activeSessions: number;
    totalUsers: number;
    recentFailedLogins: number;
  };
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStats();
    const interval = setInterval(fetchSecurityStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityStats = async () => {
    try {
      const response = await fetch('/api/security/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading security dashboard...</div>;
  }

  if (!stats) {
    return <div>Failed to load security stats</div>;
  }

  const blockRate = stats.rateLimit.totalRequests > 0 
    ? (stats.rateLimit.blockedRequests / stats.rateLimit.totalRequests) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sessions.activeSessions}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.sessions.totalUsers} total users
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Rate Limit</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{blockRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.rateLimit.blockedRequests} blocked requests
          </p>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${blockRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">DDoS Protection</h3>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ddos.blacklistedIPs}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Blacklisted IPs
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins</h3>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sessions.recentFailedLogins}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last 24 hours
          </p>
        </div>
      </div>

      {stats.ddos.suspiciousIPs > 10 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              High number of suspicious IPs detected ({stats.ddos.suspiciousIPs})
            </p>
            <p className="text-amber-800 dark:text-amber-200">
              Consider reviewing security rules.
            </p>
          </div>
        </div>
      )}

      {stats.rateLimit.topOffenders.length > 0 && (
        <div className="p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Top Rate Limit Offenders</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">IPs with the most blocked requests</p>
          <div className="space-y-2">
            {stats.rateLimit.topOffenders.map((offender, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 rounded bg-gray-50 dark:bg-gray-800/50">
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{offender.ip}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {offender.count} blocked
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}