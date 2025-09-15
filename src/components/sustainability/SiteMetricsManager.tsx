'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
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
  Users,
  Target,
  Loader2,
  Building,
  ChartBar,
  Database,
  Download,
  Upload
} from 'lucide-react';
import { useTranslations } from '@/providers/LanguageProvider';
import toast from 'react-hot-toast';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

const scopeIcons = {
  scope_1: Factory,
  scope_2: Zap,
  scope_3: Globe
};

interface Site {
  id: string;
  name: string;
  devices_count?: number;
}

interface SiteMetricsManagerProps {
  sites: Site[];
  organizationMetrics: any[];
  onRefresh: () => void;
  onAddData: () => void;
  onImport: () => void;
  onDashboard: () => void;
  onCreateTestData: () => void;
}

export default function SiteMetricsManager({
  sites,
  organizationMetrics,
  onRefresh,
  onAddData,
  onImport,
  onDashboard,
  onCreateTestData
}: SiteMetricsManagerProps) {
  const t = useTranslations('settings.sustainability');
  const [selectedSite, setSelectedSite] = useState<string>('organization');
  const [siteMetrics, setSiteMetrics] = useState<any>({});
  const [metricsBySite, setMetricsBySite] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSiteMetrics();
  }, []);

  // Set default site when sites are loaded
  useEffect(() => {
    if (sites.length > 0 && selectedSite === 'organization') {
      // Default to the first site
      setSelectedSite(sites[0].id);
    }
  }, [sites]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSiteMetrics = async () => {
    setLoading(true);
    try {
      // Fetch both site metrics and catalog
      const [siteResponse, catalogResponse] = await Promise.all([
        fetch('/api/sustainability/metrics/sites'),
        fetch('/api/sustainability/metrics/catalog')
      ]);

      const [siteData, catalogData] = await Promise.all([
        siteResponse.json(),
        catalogResponse.json()
      ]);

      if (siteResponse.ok) {
        const metricsBySiteArray = Array.isArray(siteData.metricsBySite) ? siteData.metricsBySite : [];
        setMetricsBySite(metricsBySiteArray);
        // Build site metrics lookup
        const siteMetricsLookup = {};
        metricsBySiteArray.forEach((site: any) => {
          if (site.metrics && Array.isArray(site.metrics)) {
            siteMetricsLookup[site.siteId] = new Set(site.metrics.map((m: any) => m.metric_id));
          }
        });
        setSiteMetrics(siteMetricsLookup);
      } else {
        toast.error(siteData.error || 'Failed to load site metrics');
      }

      if (catalogResponse.ok) {
        setCatalog(catalogData.grouped || {});
      } else {
        toast.error(catalogData.error || 'Failed to load metrics catalog');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleMetricForSite = async (metricId: string, siteId: string) => {
    const currentMetrics = siteMetrics[siteId] || new Set();
    const isSelected = currentMetrics.has(metricId);

    setSaving(true);
    try {
      if (isSelected) {
        // Remove metric from site
        const response = await fetch('/api/sustainability/metrics/sites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, metricId })
        });

        if (response.ok) {
          const newSiteMetrics = { ...siteMetrics };
          newSiteMetrics[siteId] = new Set(newSiteMetrics[siteId]);
          newSiteMetrics[siteId].delete(metricId);
          setSiteMetrics(newSiteMetrics);
          toast.success('Metric removed from site');
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      } else {
        // Add metric to site
        const response = await fetch('/api/sustainability/metrics/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, metricIds: [metricId] })
        });

        if (response.ok) {
          const newSiteMetrics = { ...siteMetrics };
          if (!newSiteMetrics[siteId]) {
            newSiteMetrics[siteId] = new Set();
          } else {
            newSiteMetrics[siteId] = new Set(newSiteMetrics[siteId]);
          }
          newSiteMetrics[siteId].add(metricId);
          setSiteMetrics(newSiteMetrics);
          toast.success('Metric added to site');
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      }
    } catch (error) {
      console.error('Error updating site metric:', error);
      toast.error(error.message || 'Failed to update metric');
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

  // Get metrics for current site
  const currentSiteMetrics = selectedSite !== 'organization'
    ? metricsBySite.find((site: any) => site.siteId === selectedSite)
    : null;

  const currentSite = sites.find(s => s.id === selectedSite);

  // Organization summary stats
  const getOrganizationSummary = () => {
    const totalMetrics = new Set();
    const siteMetricCounts: any = {};

    organizationMetrics.forEach((metric: any) => {
      totalMetrics.add(metric.metric_id);
    });

    if (metricsBySite && Array.isArray(metricsBySite)) {
      metricsBySite.forEach((site: any) => {
        if (site.metrics && Array.isArray(site.metrics)) {
          siteMetricCounts[site.siteName || site.siteId] = site.metrics.length;
          site.metrics.forEach((metric: any) => {
            totalMetrics.add(metric.metric_id);
          });
        }
      });
    }

    return {
      totalMetrics: totalMetrics.size,
      metricsBreakdown: siteMetricCounts,
      totalSites: sites.length
    };
  };

  const filterMetrics = (metrics: any[]) => {
    if (!searchTerm) return metrics;
    return metrics.filter((m: any) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Selector and Action Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 relative" ref={dropdownRef}>
          <ChartBar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 accent-text" />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring text-sm text-left"
          >
            {selectedSite === 'organization' ? (
              'View Organization Summary'
            ) : (
              sites.find(s => s.id === selectedSite)?.name || 'Select a site...'
            )}
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg overflow-hidden"
              >
                <div className="py-1 max-h-60 overflow-auto">
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        setSelectedSite(site.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors flex items-center gap-2 ${
                        selectedSite === site.id ? 'bg-gray-50 dark:bg-white/[0.03]' : ''
                      }`}
                    >
                      <Building className="w-4 h-4 accent-text" />
                      <span className="text-gray-700 dark:text-gray-300">{site.name}</span>
                      {selectedSite === site.id && (
                        <Check className="w-4 h-4 ml-auto accent-text" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 dark:border-white/[0.05] mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSite('organization');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors flex items-center gap-2 ${
                        selectedSite === 'organization' ? 'bg-gray-50 dark:bg-white/[0.03]' : ''
                      }`}
                    >
                      <ChartBar className="w-4 h-4 accent-text" />
                      <span className="text-gray-700 dark:text-gray-300">View Organization Summary</span>
                      {selectedSite === 'organization' && (
                        <Check className="w-4 h-4 ml-auto accent-text" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
          title="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>

        <button
          onClick={onImport}
          className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onDashboard}
          className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
          title="Upload"
        >
          <Upload className="w-4 h-4" />
        </button>

        {sites.length === 0 && (
          <button
            onClick={onCreateTestData}
            className="px-4 py-2.5 accent-gradient-lr text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90"
          >
            <Database className="w-4 h-4" />
            Need Test Data?
          </button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddData}
          className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
          title="Add Data"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Content Display */}
      {selectedSite === 'organization' ? (
        // Organization Summary View
        <div className="space-y-6">

          {/* Sites Breakdown */}
          {Object.keys(getOrganizationSummary().metricsBreakdown).length > 0 && (
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Metrics by Site
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(getOrganizationSummary().metricsBreakdown).map(([siteName, count]: [string, any]) => (
                  <div key={siteName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 accent-text" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{siteName}</span>
                    </div>
                    <span className="text-sm text-[#616161] dark:text-[#757575]">{count} metrics</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organization Metrics List */}
          {organizationMetrics.length > 0 && (
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Organization-Level Metrics ({organizationMetrics.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {organizationMetrics.map((metric: any) => {
                  const ScopeIcon = scopeIcons[metric.metric?.scope as keyof typeof scopeIcons] || Package;
                  return (
                    <div
                      key={metric.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-white/[0.05] rounded-lg"
                    >
                      <ScopeIcon className="w-4 h-4 accent-text" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {metric.metric?.name || 'Unknown Metric'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {metric.metric?.category} • {metric.metric?.scope?.replace('scope_', 'Scope ')}
                        </p>
                      </div>
                      <Check className="w-4 h-4 accent-text" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Individual Site View
        <div className="space-y-6">
          {currentSite && (
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 accent-gradient rounded-lg flex items-center justify-center">
                    <Factory className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentSite.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentSiteMetrics?.metrics?.length || 0} metrics configured
                    </p>
                  </div>
                </div>
              </div>

              {/* Site Metrics Display */}
              {currentSiteMetrics && currentSiteMetrics.metrics && currentSiteMetrics.metrics.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Configured Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSiteMetrics.metrics.map((metric: any) => {
                      const ScopeIcon = scopeIcons[metric.metrics_catalog?.scope as keyof typeof scopeIcons] || Package;
                      return (
                        <div
                          key={metric.id}
                          className="flex items-center gap-3 p-4 border border-gray-200 dark:border-white/[0.05] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <ScopeIcon className="w-5 h-5 accent-text" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {metric.metrics_catalog?.name || 'Unknown Metric'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {metric.metrics_catalog?.category} • {metric.metrics_catalog?.scope?.replace('scope_', 'Scope ')}
                            </p>
                            {metric.metrics_catalog?.unit && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Unit: {metric.metrics_catalog.unit}
                              </p>
                            )}
                          </div>
                          <Check className="w-4 h-4 accent-text" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Factory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No metrics configured for this site
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add metrics to start tracking sustainability data
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}