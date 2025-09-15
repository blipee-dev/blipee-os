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
  Download,
  Database,
  Building2,
  Activity,
  ClipboardList,
  Zap,
  CheckCircle,
  FileImage,
  Sparkles,
  Eye,
  Check,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

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
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>(metric?.id || '');
  const [siteMetrics, setSiteMetrics] = useState<any[]>([]);
  const [loadingSiteMetrics, setLoadingSiteMetrics] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
    end: new Date().toISOString().split('T')[0].slice(0, 7) + '-31'
  });
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    evidence_url: '',
    data_quality: 'measured',
    custom_emission_factor: '',
    emission_factor_justification: ''
  });
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [documentMode, setDocumentMode] = useState<'csv' | 'document'>('document');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (metric) {
      setSelectedMetric(metric.id);
    }
  }, [metric]);

  // Fetch site metrics when site is selected
  useEffect(() => {
    if (selectedSite) {
      fetchSiteMetrics(selectedSite);
    } else {
      setSiteMetrics([]);
      setSelectedMetric('');
    }
  }, [selectedSite]);

  const fetchSiteMetrics = async (siteId: string) => {
    setLoadingSiteMetrics(true);
    try {
      const res = await fetch(`/api/sustainability/metrics/sites?site_id=${siteId}`);
      const data = await res.json();

      if (data.siteMetrics) {
        setSiteMetrics(data.siteMetrics);
        // Reset metric selection when site changes
        if (!metric) {
          setSelectedMetric('');
        }
      }
    } catch (error) {
      console.error('Error fetching site metrics:', error);
      toast.error('Failed to load site metrics');
    } finally {
      setLoadingSiteMetrics(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite) {
      toast.error('Please select a site');
      return;
    }
    if (!selectedMetric || !formData.value) {
      toast.error('Please select a metric and enter a value');
      return;
    }
    // Validate justification if custom emission factor is provided
    if (formData.custom_emission_factor && !formData.emission_factor_justification) {
      toast.error('Please provide justification for the custom emission factor');
      return;
    }

    setSaving(true);
    try {
      // Find the metric data from siteMetrics
      const metricData = siteMetrics.find(m => m.metric_id === selectedMetric);
      const metricCatalog = metricData?.metrics_catalog;

      // Use custom emission factor if provided, otherwise use default
      const emissionFactor = formData.custom_emission_factor
        ? parseFloat(formData.custom_emission_factor)
        : metricCatalog?.emission_factor;

      const res = await fetch('/api/sustainability/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_id: selectedMetric,
          site_id: selectedSite,
          period_start: selectedPeriod.start,
          period_end: selectedPeriod.end,
          value: parseFloat(formData.value),
          custom_emission_factor: formData.custom_emission_factor || null,
          emission_factor_justification: formData.emission_factor_justification || null,
          data_quality: formData.data_quality,
          notes: formData.notes,
          evidence_url: formData.evidence_url
        })
      });

      if (!res.ok) throw new Error('Failed to save data');

      const result = await res.json();

      // Show success message
      setSuccess(true);
      setError(null);
      const emissions = result.data?.calculated_emissions;
      if (emissions) {
        toast.success(`Data saved! CO2e: ${emissions.toFixed(2)} kg`);
      } else {
        toast.success('Data saved successfully!');
      }

      // Reset form
      setFormData({
        value: '',
        notes: '',
        evidence_url: '',
        data_quality: 'measured',
        custom_emission_factor: '',
        emission_factor_justification: ''
      });

      onDataSaved();

      // Close after a short delay if not metric-specific
      if (!metric) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving data:', err);
      setError(err.message || 'Failed to save data');
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (documentMode === 'csv') {
      // Original CSV import
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
    } else {
      // AI document extraction
      await handleDocumentExtraction(file);
    }
  };

  const handleDocumentExtraction = async (file: File) => {
    if (!selectedSite) {
      toast.error('Please select a site first');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('siteId', selectedSite);

      const response = await fetch('/api/sustainability/extract-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Extraction failed');

      const result = await response.json();
      setExtractedData(result.data);
      setReviewMode(true);
      toast.success(`AI extracted ${result.data.extractedData?.length || 0} data points`);
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract data from document');
    } finally {
      setExtracting(false);
    }
  };

  const saveExtractedData = async () => {
    if (!extractedData?.extractedData) return;

    setSaving(true);
    try {
      for (const item of extractedData.extractedData) {
        const dataEntry = {
          site_id: selectedSite,
          metric_id: item.metricId,
          value: parseFloat(item.value),
          period_start: item.period.start,
          period_end: item.period.end,
          data_quality: item.confidence > 0.9 ? 'measured' : 'estimated',
          notes: `AI extracted: ${item.description}`,
          evidence_url: '',
          custom_emission_factor: null
        };

        await fetch('/api/sustainability/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataEntry)
        });
      }

      toast.success('All extracted data saved successfully');
      setExtractedData(null);
      setReviewMode(false);
      onDataSaved();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save extracted data');
    } finally {
      setSaving(false);
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric ? `Enter Data: ${metric.name}` : 'Enter Sustainability Data'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

              </div>

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 border accent-border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 accent-text" />
                    <p className="accent-text font-medium">
                      Data saved successfully!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-500">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Toggle Bulk Mode Tabs */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10">
                  <button
                    onClick={() => setBulkMode(false)}
                    className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
                      !bulkMode
                        ? 'accent-text border-current'
                        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Single Entry
                  </button>
                  <button
                    onClick={() => setBulkMode(true)}
                    className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
                      bulkMode
                        ? 'accent-text border-current'
                        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Bulk Import
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {bulkMode ? (
                  <div className="space-y-6">
                    {/* Site Selection for Document Mode */}
                    {documentMode === 'document' && !reviewMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Building2 className="w-4 h-4 inline mr-2" />
                          Select Site
                        </label>
                        <CustomDropdown
                          value={selectedSite}
                          onChange={(value) => setSelectedSite(value as string)}
                          options={[
                            { value: '', label: 'Choose a site...' },
                            ...sites.map(site => ({
                              value: site.id,
                              label: site.name
                            }))
                          ]}
                          className="w-full"
                          placeholder="Choose a site..."
                        />
                      </div>
                    )}

                    {/* Upload Mode Selector */}
                    {!reviewMode && (
                      <div className="flex gap-4 mb-6">
                        <button
                          onClick={() => setDocumentMode('document')}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            documentMode === 'document'
                              ? 'accent-border bg-gradient-to-r from-[rgba(var(--accent-primary-rgb),0.1)] to-[rgba(var(--accent-secondary-rgb),0.1)]'
                              : 'border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30'
                          }`}
                        >
                          <Sparkles className={`w-6 h-6 mx-auto mb-2 ${documentMode === 'document' ? 'accent-text' : 'text-gray-400'}`} />
                          <div className={`font-medium ${documentMode === 'document' ? 'accent-text' : 'text-gray-700 dark:text-gray-300'}`}>
                            AI Document Extract
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Upload utility bills, invoices
                          </div>
                        </button>
                        <button
                          onClick={() => setDocumentMode('csv')}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            documentMode === 'csv'
                              ? 'accent-border bg-gradient-to-r from-[rgba(var(--accent-primary-rgb),0.1)] to-[rgba(var(--accent-secondary-rgb),0.1)]'
                              : 'border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30'
                          }`}
                        >
                          <FileText className={`w-6 h-6 mx-auto mb-2 ${documentMode === 'csv' ? 'accent-text' : 'text-gray-400'}`} />
                          <div className={`font-medium ${documentMode === 'csv' ? 'accent-text' : 'text-gray-700 dark:text-gray-300'}`}>
                            CSV Import
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Bulk data from spreadsheets
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Extraction Review Mode */}
                    {reviewMode && extractedData ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Review Extracted Data
                          </h3>
                          <button
                            onClick={() => {
                              setReviewMode(false);
                              setExtractedData(null);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Document Info */}
                        {extractedData.documentInfo && (
                          <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-4 mb-4">
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Document Type:</span> {extractedData.documentInfo.type}</div>
                              {extractedData.documentInfo.vendor && (
                                <div><span className="font-medium">Vendor:</span> {extractedData.documentInfo.vendor}</div>
                              )}
                              {extractedData.documentInfo.date && (
                                <div><span className="font-medium">Date:</span> {extractedData.documentInfo.date}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Extracted Data Points */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {extractedData.extractedData?.map((item: any, index: number) => (
                            <div key={index} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {item.metricName || item.description}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {item.value} {item.unit} • {item.period.start} to {item.period.end}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      item.confidence > 0.8
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    }`}>
                                      {Math.round(item.confidence * 100)}% confidence
                                    </span>
                                    {item.needsReview && (
                                      <span className="text-xs text-orange-600 dark:text-orange-400">
                                        Needs review
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button className="ml-4 p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded">
                                  <Edit2 className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={saveExtractedData}
                            disabled={saving}
                            className="flex-1 px-4 py-2 accent-gradient-lr text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                          >
                            {saving ? (
                              <><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Saving...</>
                            ) : (
                              <><Check className="w-4 h-4 inline mr-2" /> Save All Data</>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-8 text-center bg-gray-50/50 dark:bg-white/[0.02]">
                          {extracting ? (
                            <div>
                              <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Extracting Data with AI...
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                This may take a few moments
                              </p>
                            </div>
                          ) : (
                            <>
                              {documentMode === 'document' ? (
                                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              ) : (
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              )}
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {documentMode === 'document'
                                  ? 'Upload Utility Bill or Invoice'
                                  : 'Upload CSV or Excel File'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {documentMode === 'document'
                                  ? 'AI will extract emissions data automatically'
                                  : 'Import multiple data points at once'}
                              </p>

                              <input
                                type="file"
                                accept={documentMode === 'document'
                                  ? ".pdf,.png,.jpg,.jpeg,.gif,.webp"
                                  : ".csv,.xlsx,.xls"}
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={documentMode === 'document' && !selectedSite}
                              />
                              <label
                                htmlFor="file-upload"
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-all ${
                                  documentMode === 'document' && !selectedSite
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'accent-gradient-lr hover:opacity-90 text-white'
                                }`}
                              >
                                {documentMode === 'document' ? (
                                  <><Sparkles className="w-4 h-4" /> Choose Document</>
                                ) : (
                                  <><Upload className="w-4 h-4" /> Choose File</>
                                )}
                              </label>

                              {documentMode === 'csv' && (
                                <button
                                  onClick={downloadTemplate}
                                  className="block mx-auto mt-4 text-sm accent-text hover:opacity-80 transition-opacity"
                                >
                                  <Download className="w-4 h-4 inline mr-1" />
                                  Download Template
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {/* Instructions */}
                    {!reviewMode && (
                      <div className="border accent-border rounded-lg p-4" style={{ backgroundColor: `rgba(var(--accent-primary-rgb), 0.05)` }}>
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 accent-text flex-shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm accent-text">
                            {documentMode === 'document' ? (
                              <>
                                <p className="font-medium">AI Document Extraction:</p>
                                <ul className="list-disc list-inside space-y-1 accent-text opacity-90">
                                  <li>Upload utility bills, invoices, or receipts</li>
                                  <li>Supports PDF, PNG, JPG, and other image formats</li>
                                  <li>AI automatically identifies consumption data</li>
                                  <li>Review and confirm extracted values before saving</li>
                                  <li>Best results with clear, readable documents</li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">CSV Import Requirements:</p>
                                <ul className="list-disc list-inside space-y-1 accent-text opacity-90">
                                  <li>CSV or Excel format (.csv, .xlsx, .xls)</li>
                                  <li>Include columns: metric_code, site_name, period_start, period_end, value</li>
                                  <li>Dates should be in YYYY-MM-DD format</li>
                                  <li>Metric codes must match system codes</li>
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Site & Metric Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 accent-text" />
                        Data Source
                      </h3>

                      {/* Site Selection */}
                      <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Site <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={selectedSite}
                        onChange={(value) => setSelectedSite(value as string)}
                        options={[
                          { value: '', label: 'Choose a site...' },
                          ...sites.map(site => ({
                            value: site.id,
                            label: site.name
                          }))
                        ]}
                        className="w-full"
                        placeholder="Choose a site..."
                      />
                    </div>

                      {/* Metric Selection - Shows site-specific metrics */}
                    {!metric && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Metric <span className="text-red-500">*</span>
                        </label>
                        {!selectedSite ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                            Please select a site first to see available metrics
                          </div>
                        ) : loadingSiteMetrics ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Loading site metrics...</span>
                          </div>
                        ) : (
                          <CustomDropdown
                            value={selectedMetric}
                            onChange={(value) => setSelectedMetric(value as string)}
                            options={
                              siteMetrics.length === 0
                                ? [{ value: '', label: 'No metrics assigned to this site', disabled: true }]
                                : [
                                    { value: '', label: 'Choose a metric...' },
                                    ...siteMetrics.map(sm => ({
                                      value: sm.metric_id,
                                      label: `${sm.metrics_catalog?.name} (${sm.metrics_catalog?.unit}) - ${sm.metrics_catalog?.scope?.replace('scope_', 'Scope ')}`,
                                      renderLabel: () => (
                                        <div className="flex items-center justify-between w-full">
                                          <span>{sm.metrics_catalog?.name} ({sm.metrics_catalog?.unit})</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{sm.metrics_catalog?.scope?.replace('scope_', 'Scope ')}</span>
                                            {sm.metrics_catalog?.subcategory && (
                                              <span
                                                className="text-xs px-2 py-0.5 rounded accent-text"
                                                style={{ backgroundColor: `rgba(var(--accent-primary-rgb), 0.1)` }}
                                              >
                                                {sm.metrics_catalog?.subcategory}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    }))
                                  ]
                            }
                            className="w-full"
                            disabled={!selectedSite || loadingSiteMetrics}
                            placeholder="Choose a metric..."
                          />
                        )}
                      </div>
                    )}
                    </div>

                    {/* Data Entry Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 accent-text" />
                        Entry Details
                      </h3>

                      {/* Period Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Period Start
                        </label>
                        <input
                          type="date"
                          value={selectedPeriod.start}
                          onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
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
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
                        />
                      </div>
                    </div>


                      {/* Value and Data Quality */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Data Quality
                        </label>
                        <CustomDropdown
                          value={formData.data_quality}
                          onChange={(value) => setFormData({ ...formData, data_quality: value as string })}
                          options={[
                            { value: 'measured', label: 'Measured' },
                            { value: 'calculated', label: 'Calculated' },
                            { value: 'estimated', label: 'Estimated' }
                          ]}
                          className="w-full"
                          placeholder="Select data quality"
                        />
                      </div>
                    </div>

                    </div>

                    {/* Emission Factor Override */}
                    {selectedMetric && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 accent-text" />
                          Emission Factor
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Emission Factor (Optional - Override Default)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={formData.custom_emission_factor}
                              onChange={(e) => setFormData({ ...formData, custom_emission_factor: e.target.value })}
                              placeholder={(() => {
                                const metric = siteMetrics.find(m => m.metric_id === selectedMetric);
                                const defaultFactor = metric?.metrics_catalog?.emission_factor;
                                const unit = metric?.metrics_catalog?.emission_factor_unit;
                                return defaultFactor ? `Default: ${defaultFactor} ${unit || ''}` : 'Enter custom factor';
                              })()}
                              className="flex-1 px-3 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring accent-border"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor_unit || 'kg CO2e'}
                            </span>
                          </div>
                          {siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Default: {siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor} {siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor_unit}
                              {siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor_source &&
                                ` (${siteMetrics.find(m => m.metric_id === selectedMetric)?.metrics_catalog?.emission_factor_source})`}
                            </p>
                          )}
                        </div>

                        {/* Justification - Required when custom factor is entered */}
                        {formData.custom_emission_factor && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Justification for Custom Factor <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={formData.emission_factor_justification}
                              onChange={(e) => setFormData({ ...formData, emission_factor_justification: e.target.value })}
                              placeholder="Please explain why you're using a different emission factor..."
                              rows={2}
                              className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
                              required={!!formData.custom_emission_factor}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supporting Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 accent-text" />
                        Supporting Information
                      </h3>

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
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
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
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border"
                      />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                {!bulkMode && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !selectedMetric || !formData.value}
                    className="px-5 py-2.5 accent-gradient rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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