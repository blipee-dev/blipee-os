'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Download, AlertTriangle, Eye, Clock, User } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { AuditEvent, AuditEventType, AuditEventSeverity, AuditLogQuery } from '@/lib/audit/types';

interface AuditDashboardProps {
  organizationId?: string;
}

export function AuditDashboard({ organizationId }: AuditDashboardProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<AuditLogQuery>({
    limit: 50,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    organizationId,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value instanceof Date) {
            params.set(key, value.toISOString());
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value instanceof Date) {
            params.set(key, value.toISOString());
          } else {
            params.set(key, String(value));
          }
        }
      });
      params.set('format', format);

      const response = await fetch(`/api/audit/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getSeverityColor = (severity: AuditEventSeverity) => {
    switch (severity) {
      case AuditEventSeverity.CRITICAL:
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
      case AuditEventSeverity.ERROR:
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20';
      case AuditEventSeverity.WARNING:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
    }
  };

  const getEventIcon = (type: AuditEventType) => {
    if (type.startsWith('auth.')) return <User className="h-4 w-4" />;
    if (type.startsWith('security.')) return <AlertTriangle className="h-4 w-4" />;
    if (type.startsWith('data.')) return <Eye className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const formatEventType = (type: string) => {
    return type.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Audit Logs
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={() => exportLogs('csv')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={() => exportLogs('json')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={query.search || ''}
              onChange={(e) => setQuery({ ...query, search: e.target.value || undefined })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Types
                </label>
                <select
                  multiple
                  value={query.types || []}
                  onChange={(e) => setQuery({
                    ...query,
                    types: Array.from(e.target.selectedOptions, option => option.value as AuditEventType)
                  })}
                  className="w-full h-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={AuditEventType.AUTH_LOGIN_SUCCESS}>Login Success</option>
                  <option value={AuditEventType.AUTH_LOGIN_FAILED}>Login Failed</option>
                  <option value={AuditEventType.SECURITY_THREAT_DETECTED}>Security Threat</option>
                  <option value={AuditEventType.DATA_ACCESSED}>Data Access</option>
                  <option value={AuditEventType.USER_CREATED}>User Created</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity
                </label>
                <select
                  multiple
                  value={query.severities || []}
                  onChange={(e) => setQuery({
                    ...query,
                    severities: Array.from(e.target.selectedOptions, option => option.value as AuditEventSeverity)
                  })}
                  className="w-full h-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={AuditEventSeverity.INFO}>Info</option>
                  <option value={AuditEventSeverity.WARNING}>Warning</option>
                  <option value={AuditEventSeverity.ERROR}>Error</option>
                  <option value={AuditEventSeverity.CRITICAL}>Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={query.startDate?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setQuery({
                      ...query,
                      startDate: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={query.endDate?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setQuery({
                      ...query,
                      endDate: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Audit Log Events */}
      <GlassCard>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading audit logs...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatEventType(event.type)}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.result === 'success' 
                              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20'
                          }`}>
                            {event.result}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex items-center gap-4">
                            <span>Actor: {event.actor.email || event.actor.id || 'System'}</span>
                            {event.actor.ip && <span>IP: {event.actor.ip}</span>}
                          </div>
                          {event.target && (
                            <div>Target: {event.target.name || event.target.id} ({event.target.type})</div>
                          )}
                          {event.errorDetails && (
                            <div className="text-red-600 dark:text-red-400">
                              Error: {event.errorDetails.message}
                            </div>
                          )}
                        </div>

                        {Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                              View Metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>

                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        <div>{new Date(event.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(event.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}