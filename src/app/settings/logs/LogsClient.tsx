"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Activity,
  User,
  Database,
  Key,
  Settings,
  Terminal,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { AuditEvent, AuditLogFilter, ActionCategory, OutcomeStatus, Severity } from "@/types/audit";

// Category icons
const categoryIcons: Record<ActionCategory, React.ElementType> = {
  auth: Shield,
  data: Database,
  permission: Key,
  system: Settings,
  security: AlertCircle,
  api: Terminal,
  agent: Activity,
};

// Severity colors
const severityColors = {
  info: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
  error: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
  critical: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
};

// Outcome status colors
const outcomeColors = {
  success: "text-green-600 dark:text-green-400",
  failure: "text-red-600 dark:text-red-400",
  partial: "text-yellow-600 dark:text-yellow-400",
  pending: "text-gray-600 dark:text-gray-400",
};

// Outcome icons
const outcomeIcons = {
  success: CheckCircle,
  failure: XCircle,
  partial: AlertCircle,
  pending: Clock,
};

export default function LogsPage() {
  useAuthRedirect('/settings/logs');
  const t = useTranslations("settings.logs");
  const supabase = createClient();

  // State
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<AuditLogFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    endDate: new Date().toISOString(),
  });
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | "all">("all");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "all">("all");
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply category filter
      if (selectedCategory !== "all") {
        query = query.eq('action_category', selectedCategory);
      }

      // Apply severity filter
      if (selectedSeverity !== "all") {
        query = query.eq('severity', selectedSeverity);
      }

      // Apply outcome filter
      if (selectedOutcome !== "all") {
        query = query.eq('outcome_status', selectedOutcome);
      }

      // Execute query
      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Transform the data - extract event from JSONB
      const transformedLogs = (data || []).map(record => ({
        ...record.event,
        id: record.id,
        created_at: record.created_at,
      })) as AuditEvent[];

      setLogs(transformedLogs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, selectedCategory, selectedSeverity, selectedOutcome]);

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('audit_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_events',
        },
        (payload) => {
          // Prepend new event to the list
          if (payload.new) {
            const newEvent = {
              ...payload.new.event,
              id: payload.new.id,
              created_at: payload.new.created_at,
            } as AuditEvent;
            setLogs(prev => [newEvent, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.actor?.email?.toLowerCase().includes(query) ||
      log.action?.type?.toLowerCase().includes(query) ||
      log.resource?.type?.toLowerCase().includes(query) ||
      log.resource?.name?.toLowerCase().includes(query) ||
      log.metadata?.description?.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  // Pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const dataToExport = filteredLogs;
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        const headers = ['Timestamp', 'Actor', 'Action', 'Resource', 'Status', 'IP Address'];
        const rows = dataToExport.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.actor?.email || 'System',
          log.action?.type || '',
          `${log.resource?.type || ''}: ${log.resource?.name || log.resource?.id || ''}`,
          log.outcome?.status || '',
          log.context?.ip || '',
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    // Less than 7 days
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    // Default to full date
    return date.toLocaleString();
  };

  return (
    <SettingsLayout pageTitle="Audit Logs">
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">View and monitor all system activities and changes</p>
      </header>

      <main className="p-4 sm:p-6 space-y-6">
        {/* Filters Bar */}
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
              <input
                type="text"
                placeholder="Search by user, action, resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring text-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 bg-white dark:bg-[#212121] border rounded-lg transition-all ${
                showFilters 
                  ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400' 
                  : 'border-gray-200 dark:border-white/[0.05] text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            <CustomDropdown
              value="export"
              onChange={(value) => handleExport(value as 'csv' | 'json')}
              options={[
                { value: 'csv', label: 'Export as CSV' },
                { value: 'json', label: 'Export as JSON' },
              ]}
              className="w-40"
              trigger={
                <button className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all">
                  <Download className="w-4 h-4" />
                </button>
              }
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-[#212121]/50 rounded-lg border border-gray-200 dark:border-white/[0.05]"
            >
              <CustomDropdown
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value as ActionCategory | "all")}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'auth', label: 'Authentication' },
                  { value: 'data', label: 'Data Operations' },
                  { value: 'permission', label: 'Permissions' },
                  { value: 'system', label: 'System' },
                  { value: 'security', label: 'Security' },
                  { value: 'api', label: 'API' },
                  { value: 'agent', label: 'AI Agents' },
                ]}
                className="w-40"
              />

              <CustomDropdown
                value={selectedSeverity}
                onChange={(value) => setSelectedSeverity(value as Severity | "all")}
                options={[
                  { value: 'all', label: 'All Severities' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' },
                  { value: 'critical', label: 'Critical' },
                ]}
                className="w-40"
              />

              <CustomDropdown
                value={selectedOutcome}
                onChange={(value) => setSelectedOutcome(value as OutcomeStatus | "all")}
                options={[
                  { value: 'all', label: 'All Outcomes' },
                  { value: 'success', label: 'Success' },
                  { value: 'failure', label: 'Failed' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'pending', label: 'Pending' },
                ]}
                className="w-40"
              />

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-[#757575]" />
                <input
                  type="date"
                  value={filters.startDate?.split('T')[0] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                  className="px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm"
                />
                <span className="text-gray-500 dark:text-[#757575]">to</span>
                <input
                  type="date"
                  value={filters.endDate?.split('T')[0] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                  className="px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin accent-text" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-80"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No audit logs found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Activities will appear here as they occur
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#757575]/10 border-b border-gray-200 dark:border-white/[0.05]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Actor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {paginatedLogs.map((log) => {
                      const CategoryIcon = categoryIcons[log.action?.category as ActionCategory] || Activity;
                      const OutcomeIcon = outcomeIcons[log.outcome?.status as OutcomeStatus] || Info;
                      const isExpanded = expandedRows.has(log.id);
                      
                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="text-gray-900 dark:text-white">
                                {formatTimestamp(log.created_at)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-gray-900 dark:text-white">
                                    {log.actor?.email || log.actor?.name || 'System'}
                                  </div>
                                  {log.actor?.role && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {log.actor.role}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-gray-900 dark:text-white">
                                    {log.action?.type}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {log.action?.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div>
                                <div className="text-gray-900 dark:text-white">
                                  {log.resource?.name || log.resource?.id || '-'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.resource?.type}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <OutcomeIcon className={`w-4 h-4 ${outcomeColors[log.outcome?.status as OutcomeStatus]}`} />
                                <span className={outcomeColors[log.outcome?.status as OutcomeStatus]}>
                                  {log.outcome?.status}
                                </span>
                              </div>
                              {log.metadata?.severity && log.metadata.severity !== 'info' && (
                                <span className={`mt-1 px-2 py-0.5 text-xs rounded-full ${severityColors[log.metadata.severity as Severity]}`}>
                                  {log.metadata.severity}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => toggleRowExpansion(log.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-[#757575]/5">
                                <div className="space-y-3 text-sm">
                                  {/* Context Information */}
                                  {log.context && (
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Context</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {log.context.ip && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                                            <div className="text-gray-900 dark:text-white">{log.context.ip}</div>
                                          </div>
                                        )}
                                        {log.context.session_id && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Session ID:</span>
                                            <div className="text-gray-900 dark:text-white font-mono text-xs">
                                              {log.context.session_id.substring(0, 8)}...
                                            </div>
                                          </div>
                                        )}
                                        {log.context.correlation_id && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Correlation ID:</span>
                                            <div className="text-gray-900 dark:text-white font-mono text-xs">
                                              {log.context.correlation_id.substring(0, 8)}...
                                            </div>
                                          </div>
                                        )}
                                        {log.context.user_agent && (
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">User Agent:</span>
                                            <div className="text-gray-900 dark:text-white text-xs truncate">
                                              {log.context.user_agent}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Changes */}
                                  {log.changes && (
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Changes</h4>
                                      <pre className="bg-gray-100 dark:bg-[#212121] p-3 rounded-lg overflow-x-auto text-xs">
                                        {JSON.stringify(log.changes, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Additional Information</h4>
                                      <div className="bg-gray-100 dark:bg-[#212121] p-3 rounded-lg">
                                        {log.metadata.description && (
                                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                                            {log.metadata.description}
                                          </p>
                                        )}
                                        {log.outcome?.error && (
                                          <div className="text-red-600 dark:text-red-400">
                                            <span className="font-medium">Error:</span> {log.outcome.error}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200 dark:border-white/[0.05] bg-white dark:bg-[#212121] p-4 rounded-b-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 dark:text-[#757575]">
                        Items per page:
                      </label>
                      <CustomDropdown
                        value={itemsPerPage}
                        onChange={(value) => {
                          setItemsPerPage(value as number);
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: 10, label: "10" },
                          { value: 20, label: "20" },
                          { value: 50, label: "50" },
                          { value: 100, label: "100" },
                        ]}
                        className="w-20"
                      />
                    </div>
                    <div className="text-sm text-gray-700 dark:text-[#757575]">
                      Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? "accent-gradient-lr text-white"
                                  : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-700 dark:text-[#757575]"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </SettingsLayout>
  );
}