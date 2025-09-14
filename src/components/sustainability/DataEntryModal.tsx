'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Upload,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric?: any;
  organizationMetrics: any[];
  sites: any[];
  onDataSaved: () => void;
}

export default function DataEntryModal({
  isOpen,
  onClose,
  metric,
  organizationMetrics,
  sites,
  onDataSaved
}: DataEntryModalProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>(metric?.id || '');
  const [selectedSite, setSelectedSite] = useState<string>('');
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
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (metric) {
      setSelectedMetric(metric.id);
    }
  }, [metric]);

  const handleSubmit = async () => {
    if (!selectedMetric || !formData.value) {
      toast.error('Please select a metric and enter a value');
      return;
    }

    setSaving(true);
    try {
      const metricData = organizationMetrics.find(m => m.metric_id === selectedMetric);

      const res = await fetch('/api/sustainability/metrics/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: selectedMetric,
          site_id: selectedSite || null,
          period_start: selectedPeriod.start,
          period_end: selectedPeriod.end,
          value: parseFloat(formData.value),
          unit: metricData?.metric?.unit,
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

      onDataSaved();
      if (!metric) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/sustainability/metrics/import', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to import file');

      const result = await res.json();
      toast.success(`Imported ${result.count} data points`);
      onDataSaved();
      onClose();
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Failed to import file');
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ['metric_code', 'site_name', 'period_start', 'period_end', 'value', 'notes'];
    const sampleData = [
      ['scope2_electricity_grid', 'Main Office', '2024-01-01', '2024-01-31', '15000', 'Monthly electricity consumption'],
      ['scope1_natural_gas', 'Main Office', '2024-01-01', '2024-01-31', '500', 'Heating gas consumption']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sustainability_metrics_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#111111] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {metric ? `Enter Data: ${metric.name}` : 'Enter Sustainability Data'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Toggle Bulk Mode */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setBulkMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !bulkMode
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    Single Entry
                  </button>
                  <button
                    onClick={() => setBulkMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      bulkMode
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    Bulk Import
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {bulkMode ? (
                  <div className="space-y-6">
                    {/* Bulk Import */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Upload CSV or Excel File
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Import multiple data points at once
                      </p>

                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>

                      <button
                        onClick={downloadTemplate}
                        className="block mx-auto mt-4 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download Template
                      </button>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                          <p className="font-medium">File Format Requirements:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                            <li>CSV or Excel format (.csv, .xlsx, .xls)</li>
                            <li>Include columns: metric_code, site_name, period_start, period_end, value</li>
                            <li>Dates should be in YYYY-MM-DD format</li>
                            <li>Metric codes must match system codes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Single Entry Form */}

                    {/* Metric Selection */}
                    {!metric && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Metric
                        </label>
                        <select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        >
                          <option value="">Choose a metric...</option>
                          {organizationMetrics.map(om => (
                            <option key={om.metric_id} value={om.metric_id}>
                              {om.metric?.name} ({om.metric?.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Period Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Period Start
                        </label>
                        <input
                          type="date"
                          value={selectedPeriod.start}
                          onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Period End
                        </label>
                        <input
                          type="date"
                          value={selectedPeriod.end}
                          onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        />
                      </div>
                    </div>

                    {/* Site Selection */}
                    {sites.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Site (Optional)
                        </label>
                        <select
                          value={selectedSite}
                          onChange={(e) => setSelectedSite(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        >
                          <option value="">All Sites</option>
                          {sites.map(site => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Value and Data Quality */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          placeholder="Enter value"
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Data Quality
                        </label>
                        <select
                          value={formData.data_quality}
                          onChange={(e) => setFormData({ ...formData, data_quality: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        >
                          <option value="measured">Measured</option>
                          <option value="calculated">Calculated</option>
                          <option value="estimated">Estimated</option>
                        </select>
                      </div>
                    </div>

                    {/* Evidence URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Evidence URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.evidence_url}
                        onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                        placeholder="Link to supporting document"
                        className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any relevant notes"
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.05] flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  Cancel
                </button>
                {!bulkMode && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !selectedMetric || !formData.value}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Data
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}