'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf,
  Plus,
  Check,
  X,
  Search,
  Filter,
  BarChart3,
  Globe,
  Zap,
  Factory,
  Package,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  Loader2,
  Upload,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useTranslations } from '@/providers/LanguageProvider';
import toast from 'react-hot-toast';
import DataEntryModal from '@/components/sustainability/DataEntryModal';
import SiteMetricsManager from '@/components/sustainability/SiteMetricsManager';

const scopeIcons = {
  scope_1: Factory,
  scope_2: Zap,
  scope_3: Globe
};

export default function SustainabilityMetricsPage() {
  // Check authentication
  useAuthRedirect('/settings/sustainability');

  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('settings.sustainability');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<any>({});
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());
  const [organizationMetrics, setOrganizationMetrics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Electricity', 'Mobile Combustion', 'Stationary Combustion']));
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [selectedMetricForEntry, setSelectedMetricForEntry] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'sites'>('sites');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch catalog
      const catalogRes = await fetch('/api/sustainability/metrics/catalog');
      const catalogData = await catalogRes.json();

      // Use the grouped data directly (already organized by scope)
      setCatalog(catalogData.grouped || {});

      // Fetch organization's selected metrics
      const orgRes = await fetch('/api/sustainability/metrics/organization');
      const orgData = await orgRes.json();

      if (orgData.metrics) {
        setOrganizationMetrics(orgData.metrics);
        const selected = new Set(orgData.metrics.map((m: any) => m.metric_id));
        setSelectedMetrics(selected);
      }

      // Fetch sites
      const sitesRes = await fetch('/api/sites');
      const sitesData = await sitesRes.json();
      setSites(sitesData.sites || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (metricId: string) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(metricId)) {
      newSelected.delete(metricId);
    } else {
      newSelected.add(metricId);
    }
    setSelectedMetrics(newSelected);
  };

  const saveMetrics = async () => {
    setSaving(true);
    try {
      // Get newly selected metrics (not already in organization)
      const existingIds = new Set(organizationMetrics.map(m => m.metric_id));
      const newMetricIds = Array.from(selectedMetrics).filter(id => !existingIds.has(id));

      if (newMetricIds.length > 0) {
        const res = await fetch('/api/sustainability/metrics/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric_ids: newMetricIds })
        });

        if (!res.ok) throw new Error('Failed to save metrics');

        toast.success(`${newMetricIds.length} metrics added successfully`);
        await fetchData(); // Refresh data
      }

      // Handle removed metrics
      const removedIds = organizationMetrics
        .filter(m => !selectedMetrics.has(m.metric_id))
        .map(m => m.metric_id);

      for (const metricId of removedIds) {
        await fetch('/api/sustainability/metrics/organization', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric_id: metricId })
        });
      }

      if (removedIds.length > 0) {
        toast.success(`${removedIds.length} metrics removed successfully`);
        await fetchData();
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast.error('Failed to save metrics');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const createTestData = async () => {
    toast.error('To test site functionality, you need to create organizations and sites in your Supabase database. Please check your database schema and add test data manually.');
  };

  const filterMetrics = (metrics: any[]) => {
    if (!searchTerm) return metrics;
    return metrics.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Sustainability Metrics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and track your organization's sustainability metrics and data collection
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sites.length === 0 && (
              <button
                onClick={createTestData}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Need Test Data?
              </button>
            )}
            <button
              onClick={() => {
                setSelectedMetricForEntry(null);
                setShowDataEntry(true);
              }}
              className="px-4 py-2.5 accent-gradient-lr text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90"
            >
              <PlusCircle className="w-4 h-4" />
              Add Data
            </button>
            <button
              onClick={() => {
                setSelectedMetricForEntry(null);
                setShowDataEntry(true);
              }}
              className="px-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm font-medium text-[#616161] dark:text-[#757575] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => router.push('/sustainability/dashboard')}
              className="px-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm font-medium text-[#616161] dark:text-[#757575] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#616161] dark:text-[#757575]">Total Available</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">74</p>
              </div>
              <Database className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#616161] dark:text-[#757575]">Selected</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedMetrics.size}</p>
              </div>
              <Check className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#616161] dark:text-[#757575]">Scope Coverage</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {new Set(organizationMetrics.map(m => m.metric?.scope?.replace('scope_', ''))).size}/3
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#616161] dark:text-[#757575]">Categories</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {new Set(organizationMetrics.map(m => m.metric?.category)).size}
                </p>
              </div>
              <Package className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search metrics by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['scope_1', 'scope_2', 'scope_3'].map(scope => {
              const Icon = scopeIcons[scope as keyof typeof scopeIcons];
              return (
                <button
                  key={scope}
                  onClick={() => setSelectedScope(selectedScope === scope ? null : scope)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedScope === scope
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-[#212121] border-gray-200 dark:border-white/[0.05] text-[#616161] dark:text-[#757575] hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{scope.replace('_', ' ').toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Metrics Catalog Section */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Metrics Library
          </h2>
          {selectedMetrics.size > 0 && (
            <button
              onClick={saveMetrics}
              disabled={saving}
              className="px-4 py-2 accent-gradient-lr text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Selection ({selectedMetrics.size})
                </>
              )}
            </button>
          )}
        </div>

        {/* Metrics by Scope */}
        <div className="space-y-6">
          {Object.entries(catalog).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading metrics catalog...
            </div>
          ) : (
            ['scope_1', 'scope_2', 'scope_3'].map((scope) => {
              const scopeCategories = catalog[scope] || {};
              const ScopeIcon = scopeIcons[scope as keyof typeof scopeIcons];

              if (selectedScope && selectedScope !== scope) return null;
              if (Object.keys(scopeCategories).length === 0) return null;

              return (
                <div key={scope} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <ScopeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      {scope.replace('_', ' ').toUpperCase()}
                    </h3>
                  </div>

                  {Object.entries(scopeCategories).map(([category, metrics]: [string, any]) => {
                    const metricsArray = Array.isArray(metrics) ? metrics : [];
                    const filteredMetrics = filterMetrics(metricsArray);

                    if (filteredMetrics.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);

                    return (
                      <div key={category} className="border border-gray-200 dark:border-white/[0.05] rounded-lg ml-7">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {category}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({filteredMetrics.length})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-white/[0.05] p-4">
                            <div className="space-y-3">
                              {filteredMetrics.map((metric: any) => {
                                const isSelected = selectedMetrics.has(metric.id);

                                return (
                                  <div
                                    key={metric.id}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]'
                                    }`}
                                    onClick={() => toggleMetric(metric.id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {metric.name}
                                          </span>
                                          {metric.code && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 rounded font-mono">
                                              {metric.code}
                                            </span>
                                          )}
                                        </div>
                                        {metric.description && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            {metric.description}
                                          </p>
                                        )}

                                        {/* Emission Factor Information */}
                                        {metric.emission_factor && (
                                          <div className="bg-gray-50 dark:bg-white/[0.02] rounded p-2 mb-2">
                                            <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Factor:</span>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                  {metric.emission_factor} {metric.emission_factor_unit}
                                                </span>
                                              </div>
                                              {metric.emission_factor_source && (
                                                <div className="flex items-center gap-1">
                                                  <Info className="w-3 h-3 text-gray-400" />
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {metric.emission_factor_source}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 rounded">
                                            Unit: {metric.unit}
                                          </span>
                                          {metric.subcategory && (
                                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">
                                              {metric.subcategory}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="ml-3">
                                        {isSelected ? (
                                          <Check className="w-5 h-5 text-blue-500" />
                                        ) : (
                                          <Plus className="w-5 h-5 text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      <SiteMetricsManager
        sites={sites}
        organizationMetrics={organizationMetrics}
        onRefresh={fetchData}
      />

      <DataEntryModal
        isOpen={showDataEntry}
        onClose={() => {
          setShowDataEntry(false);
          setSelectedMetricForEntry(null);
        }}
        metric={selectedMetricForEntry}
        organizationMetrics={organizationMetrics}
        sites={sites}
        onDataSaved={fetchData}
      />
    </div>
  );
}