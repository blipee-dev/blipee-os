'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Plus,
  Save,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Filter,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SustainabilityDataEntryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizationMetrics, setOrganizationMetrics] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
    end: new Date().toISOString().split('T')[0].slice(0, 7) + '-31'
  });
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    evidence_url: '',
    data_quality: 'measured'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      // Fetch organization's selected metrics
      const metricsRes = await fetch('/api/sustainability/metrics/organization');
      const metricsData = await metricsRes.json();
      setOrganizationMetrics(metricsData.metrics || []);

      // Fetch sites
      const sitesRes = await fetch('/api/sites');
      const sitesData = await sitesRes.json();
      setSites(sitesData.sites || []);

      // Fetch existing data
      await fetchMetricsData();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricsData = async () => {
    try {
      const params = new URLSearchParams({
        start_date: selectedPeriod.start,
        end_date: selectedPeriod.end
      });

      if (selectedMetric) params.append('metric_id', selectedMetric);
      if (selectedSite) params.append('site_id', selectedSite);

      const res = await fetch(`/api/sustainability/metrics/data?${params}`);
      const data = await res.json();
      setMetricsData(data.data || []);
    } catch (error) {
      console.error('Error fetching metrics data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMetric || !formData.value) {
      toast.error('Please select a metric and enter a value');
      return;
    }

    setSaving(true);
    try {
      const metric = organizationMetrics.find(m => m.metric_id === selectedMetric);

      const res = await fetch('/api/sustainability/metrics/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: selectedMetric,
          site_id: selectedSite,
          period_start: selectedPeriod.start,
          period_end: selectedPeriod.end,
          value: parseFloat(formData.value),
          unit: metric?.metric?.unit,
          data_quality: formData.data_quality,
          notes: formData.notes,
          evidence_url: formData.evidence_url
        })
      });

      if (!res.ok) throw new Error('Failed to save data');

      const result = await res.json();
      toast.success(`Data saved! CO2e: ${result.data?.co2e_emissions?.toFixed(2)} kg`);

      // Reset form
      setFormData({
        value: '',
        notes: '',
        evidence_url: '',
        data_quality: 'measured'
      });

      // Refresh data
      await fetchMetricsData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const getMetricsByScope = () => {
    const grouped = {
      scope_1: [],
      scope_2: [],
      scope_3: []
    };

    organizationMetrics.forEach(om => {
      if (om.metric?.scope) {
        grouped[om.metric.scope].push(om);
      }
    });

    return grouped;
  };

  const calculateTotalEmissions = () => {
    return metricsData.reduce((sum, item) => sum + (item.co2e_emissions || 0), 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const metricsByScope = getMetricsByScope();
  const totalEmissions = calculateTotalEmissions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold">Sustainability Data Entry</h1>
          </div>
          <p className="text-gray-400">
            Record your organization's sustainability metrics and track emissions
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Emissions</p>
                <p className="text-2xl font-bold">{(totalEmissions / 1000).toFixed(2)} tCO2e</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Metrics</p>
                <p className="text-2xl font-bold">{organizationMetrics.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Data Points</p>
                <p className="text-2xl font-bold">{metricsData.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sites</p>
                <p className="text-2xl font-bold">{sites.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Entry Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Enter Sustainability Data</h2>

              {/* Period Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Period Start</label>
                  <input
                    type="date"
                    value={selectedPeriod.start}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Period End</label>
                  <input
                    type="date"
                    value={selectedPeriod.end}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Site Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Site (Optional)</label>
                <select
                  value={selectedSite || ''}
                  onChange={(e) => setSelectedSite(e.target.value || null)}
                  className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">All Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* Metric Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Select Metric</label>
                <div className="space-y-4">
                  {Object.entries(metricsByScope).map(([scope, metrics]: [string, any[]]) => {
                    if (metrics.length === 0) return null;

                    return (
                      <div key={scope}>
                        <h3 className="text-sm font-medium text-gray-300 mb-2">
                          {scope.replace('_', ' ').toUpperCase()}
                        </h3>
                        <div className="space-y-2">
                          {metrics.map(om => (
                            <label
                              key={om.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedMetric === om.metric_id
                                  ? 'bg-purple-500/20 border-purple-500/50'
                                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="metric"
                                  value={om.metric_id}
                                  checked={selectedMetric === om.metric_id}
                                  onChange={(e) => setSelectedMetric(e.target.value)}
                                  className="w-4 h-4 text-purple-500"
                                />
                                <div>
                                  <p className="font-medium">{om.metric?.name}</p>
                                  <p className="text-xs text-gray-400">{om.metric?.category}</p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-400">{om.metric?.unit}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Value Input */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Enter value"
                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Data Quality</label>
                  <select
                    value={formData.data_quality}
                    onChange={(e) => setFormData({ ...formData, data_quality: e.target.value })}
                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="measured">Measured</option>
                    <option value="calculated">Calculated</option>
                    <option value="estimated">Estimated</option>
                  </select>
                </div>
              </div>

              {/* Evidence URL */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Evidence URL (Optional)</label>
                <input
                  type="url"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                  placeholder="Link to supporting document"
                  className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any relevant notes"
                  rows={3}
                  className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={saving || !selectedMetric || !formData.value}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Data
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Recent Entries */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {metricsData.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No data entries yet</p>
                ) : (
                  metricsData.slice(0, 10).map(entry => (
                    <div
                      key={entry.id}
                      className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{entry.metric?.name}</p>
                          <p className="text-xs text-gray-400">{entry.metric?.category}</p>
                        </div>
                        {entry.verification_status === 'verified' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>{entry.value} {entry.unit}</span>
                        <span className="text-green-400">
                          {entry.co2e_emissions?.toFixed(2)} kgCO2e
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(entry.period_start).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {entry.data_quality}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}