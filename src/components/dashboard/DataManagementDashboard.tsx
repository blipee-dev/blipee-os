'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Search,
  ChevronRight,
  BarChart3,
  Zap,
  Package,
  AlertTriangle
} from 'lucide-react';
import { InlineDataEntry } from '@/components/sustainability/targets/InlineDataEntry';
import { BulkDataEntry } from '@/components/sustainability/targets/BulkDataEntry';
import toast from 'react-hot-toast';

interface PendingMetric {
  id: string;
  name: string;
  scope: number;
  category: string;
  unit: string;
  lastUpdate?: string;
  dueDate: string;
  status: 'due' | 'overdue' | 'upcoming' | 'complete';
  frequency: 'monthly' | 'quarterly' | 'annually';
}

interface DataManagementDashboardProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function DataManagementDashboard({ organizationId }: DataManagementDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'historical' | 'bulk' | 'documents'>('pending');
  const [pendingMetrics, setPendingMetrics] = useState<PendingMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<PendingMetric | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | '1' | '2' | '3'>('all');
  const [allMetricsData, setAllMetricsData] = useState<any>(null);
  const [loadingAllMetrics, setLoadingAllMetrics] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchPendingMetrics();
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId && (activeTab === 'all' || activeTab === 'historical')) {
      fetchAllMetricsData();
    }
  }, [organizationId, activeTab]);

  const fetchPendingMetrics = async () => {
    try {
      const response = await fetch('/api/sustainability/metrics/pending');

      if (response.ok) {
        const data = await response.json();
        setPendingMetrics(data);
      } else {
        setPendingMetrics([]);
        if (response.status === 404) {
          toast.error('Please configure your organization first');
        }
      }
    } catch (error) {
      console.error('Error fetching pending metrics:', error);
      toast.error('Failed to load pending metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMetricsData = async () => {
    try {
      setLoadingAllMetrics(true);
      const response = await fetch('/api/sustainability/metrics/all', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAllMetricsData(data);
      } else {
        setAllMetricsData(null);
      }
    } catch (error) {
      console.error('Error fetching all metrics data:', error);
      toast.error('Failed to load metrics data');
      setAllMetricsData(null);
    } finally {
      setLoadingAllMetrics(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-red-500';
      case 'due': return 'text-yellow-500';
      case 'upcoming': return 'text-blue-500';
      case 'complete': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="w-5 h-5" />;
      case 'due': return <AlertCircle className="w-5 h-5" />;
      case 'upcoming': return <Clock className="w-5 h-5" />;
      case 'complete': return <CheckCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getScopeIcon = (scope: number) => {
    switch (scope) {
      case 1: return <BarChart3 className="w-4 h-4" />;
      case 2: return <Zap className="w-4 h-4" />;
      case 3: return <Package className="w-4 h-4" />;
      default: return null;
    }
  };

  const getScopeColor = (scope: number) => {
    switch (scope) {
      case 1: return 'from-green-500 to-teal-500';
      case 2: return 'from-yellow-500 to-orange-500';
      case 3: return 'from-blue-500 to-purple-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const filteredMetrics = pendingMetrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         metric.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = filterScope === 'all' || metric.scope.toString() === filterScope;
    return matchesSearch && matchesScope;
  });

  const stats = {
    due: pendingMetrics.filter(m => m.status === 'due').length,
    overdue: pendingMetrics.filter(m => m.status === 'overdue').length,
    complete: pendingMetrics.filter(m => m.status === 'complete').length,
    total: pendingMetrics.length
  };

  const completionRate = stats.total > 0 ? (stats.complete / stats.total * 100).toFixed(0) : 0;

  const tabs = [
    { id: 'pending', label: 'Pending Updates', icon: Clock },
    { id: 'all', label: 'All Metrics', icon: Database },
    { id: 'historical', label: 'Historical Data', icon: Calendar },
    { id: 'bulk', label: 'Bulk Operations', icon: FileSpreadsheet },
    { id: 'documents', label: 'Documents', icon: Upload }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Due Now</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.due}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Metrics need updating
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Overdue</span>
          </div>
          <div className="text-3xl font-bold text-red-500">
            {stats.overdue}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Need immediate attention
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Complete</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {completionRate}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Data coverage
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Active metrics
          </div>
        </motion.div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search metrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scope Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope:</span>
            <div className="flex gap-1">
              {['all', '1', '2', '3'].map((scope) => (
                <button
                  key={scope}
                  onClick={() => setFilterScope(scope as any)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    filterScope === scope
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {scope === 'all' ? 'All' : `Scope ${scope}`}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-1">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200
                          ${isActive
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {filteredMetrics.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No pending metrics to update right now.
                </p>
              </div>
            ) : (
              filteredMetrics.map((metric) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getScopeColor(metric.scope)} p-2 flex items-center justify-center text-white`}>
                        {getScopeIcon(metric.scope)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {metric.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Scope {metric.scope} • {metric.category} • {metric.unit}
                          </span>
                          <div className={`flex items-center gap-1 ${getStatusColor(metric.status)}`}>
                            {getStatusIcon(metric.status)}
                            <span className="text-sm capitalize">{metric.status}</span>
                          </div>
                        </div>
                        {metric.lastUpdate && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Last updated: {new Date(metric.lastUpdate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMetric(selectedMetric?.id === metric.id ? null : metric)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      {selectedMetric?.id === metric.id ? 'Close' : 'Enter Data'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedMetric?.id === metric.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Inline Data Entry */}
                  {selectedMetric?.id === metric.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <InlineDataEntry
                        metricId={metric.id}
                        metricName={metric.name}
                        unit={metric.unit}
                        scope={metric.scope}
                        onDataSubmit={() => {
                          toast.success(`${metric.name} data saved!`);
                          setSelectedMetric(null);
                          fetchPendingMetrics();
                        }}
                        onSkip={() => {
                          setSelectedMetric(null);
                        }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'bulk' && (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <BulkDataEntry
              metricId="bulk"
              metricName="Multiple Metrics"
              unit="Various"
              scope={0}
              onComplete={() => {
                toast.success('Bulk data imported successfully!');
                fetchPendingMetrics();
              }}
            />
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12">
              <div className="text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Upload Documents
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Upload utility bills, invoices, or reports for automatic data extraction
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                  Choose Files
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
