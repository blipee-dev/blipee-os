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
import { SettingsLayout } from '@/components/settings/SettingsLayout';

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
  const [selectedScope, setSelectedScope] = useState<string>('scope_1');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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
      toast.error(t('failedToLoadMetrics'));
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

        toast.success(t('metricsAddedSuccess', { count: newMetricIds.length }));
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
        toast.success(t('metricsRemovedSuccess', { count: removedIds.length }));
        await fetchData();
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast.error(t('failedToSaveMetrics'));
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
    toast.error(t('testDataError'));
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
    <SettingsLayout pageTitle={t('title')}>
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">{t('subtitle')}</p>
      </header>

      <main className="p-4 sm:p-6">
        <SiteMetricsManager
          sites={sites}
          organizationMetrics={organizationMetrics}
          onRefresh={fetchData}
          onAddData={() => {
            setSelectedMetricForEntry(null);
            setShowDataEntry(true);
          }}
          onImport={() => {
            setSelectedMetricForEntry(null);
            setShowDataEntry(true);
          }}
          onDashboard={() => router.push('/sustainability/dashboard')}
          onCreateTestData={createTestData}
        />

      {/* Metrics Catalog Section */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('metricsLibrary')}
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
                  {t('saving')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t('saveSelection')} ({selectedMetrics.size})
                </>
              )}
            </button>
          )}
        </div>

        {/* Tabs for Scopes */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/[0.05] mb-6">
          {['scope_1', 'scope_2', 'scope_3'].map(scope => {
            const Icon = scopeIcons[scope as keyof typeof scopeIcons];
            return (
              <button
                key={scope}
                onClick={() => setSelectedScope(scope)}
                className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                  selectedScope === scope
                    ? 'accent-text border-current'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(scope)}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 accent-ring transition-all"
          />
        </div>

        {/* Metrics by Scope */}
        <div className="space-y-6">
          {Object.entries(catalog).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('loadingMetrics')}
            </div>
          ) : (
            ['scope_1', 'scope_2', 'scope_3'].map((scope) => {
              const scopeCategories = catalog[scope] || {};
              const ScopeIcon = scopeIcons[scope as keyof typeof scopeIcons];

              if (selectedScope !== scope) return null;
              if (Object.keys(scopeCategories).length === 0) return null;

              return (
                <div key={scope} className="space-y-3">

                  {Object.entries(scopeCategories).map(([category, metrics]: [string, any]) => {
                    const metricsArray = Array.isArray(metrics) ? metrics : [];
                    const filteredMetrics = filterMetrics(metricsArray);

                    if (filteredMetrics.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);

                    return (
                      <div key={category} className="border border-gray-200 dark:border-white/[0.05] rounded-lg">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors"
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
                                    className="p-4 rounded-lg border bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 pt-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleMetric(metric.id)}
                                          className="w-4 h-4 accent-checkbox rounded focus:ring-2 accent-ring focus:ring-offset-0"
                                        />
                                      </div>
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
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('factor')}</span>
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
                                            {t('unit')} {metric.unit}
                                          </span>
                                          {metric.subcategory && (
                                            <span
                                              className="text-xs px-2 py-0.5 rounded accent-text"
                                              style={{ backgroundColor: `rgba(var(--accent-primary-rgb), 0.1)` }}
                                            >
                                              {metric.subcategory}
                                            </span>
                                          )}
                                        </div>
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
      </main>
    </SettingsLayout>
  );
}