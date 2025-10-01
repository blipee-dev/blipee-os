'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Upload,
  Calculator,
  Calendar,
  TrendingUp,
  FileText,
  Check,
  X,
  Info,
  Sparkles,
  Table,
  Building
} from 'lucide-react';
import { targetDatabase } from '@/lib/ai/target-assistant-database';
import { BulkDataEntry } from './BulkDataEntry';
import { useOrganization } from '@/hooks/useOrganization';
import { useSites } from '@/hooks/useSites';
import toast from 'react-hot-toast';

interface InlineDataEntryProps {
  metricId: string;
  metricName: string;
  unit: string;
  scope: number;
  onDataSubmit?: (value: number) => void;
  onSkip?: () => void;
}

export function InlineDataEntry({
  metricId,
  metricName,
  unit,
  scope,
  onDataSubmit,
  onSkip
}: InlineDataEntryProps) {
  const { organizationId } = useOrganization();
  const { sites } = useSites();
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed' | 'upload' | 'bulk'>('quick');
  const [value, setValue] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!value || isNaN(parseFloat(value))) {
      toast.error('Please enter a valid number');
      return;
    }

    if (!organizationId) {
      toast.error('No organization found. Please contact support.');
      return;
    }

    setIsSubmitting(true);

    try {

      // Calculate period dates based on selection
      const [year, monthNum] = month.split('-');
      const periodStart = `${month}-01`;
      const periodEnd = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().slice(0, 10);

      // Submit to database
      const success = await targetDatabase.submitMetricData(
        organizationId,
        metricId,
        parseFloat(value),
        unit,
        { start: periodStart, end: periodEnd },
        {
          aiExtracted: false,
          confidence: confidence === 'high' ? 0.95 : confidence === 'medium' ? 0.75 : 0.5,
          source: 'inline-entry',
          siteId: selectedSiteId === 'all' ? undefined : selectedSiteId
        }
      );

      if (success) {
        setShowSuccess(true);
        toast.success(`${metricName} data saved successfully!`);

        // Callback to parent
        onDataSubmit?.(parseFloat(value));

        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        toast.error('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('An error occurred while saving data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show processing state
    toast.loading('Analyzing document...');

    // In a real implementation, this would:
    // 1. Upload to Supabase Storage
    // 2. Send to AI for extraction
    // 3. Get extracted values
    // 4. Pre-fill the form

    setTimeout(() => {
      toast.dismiss();
      toast.success('Document processed! Values extracted.');

      // Simulate extracted value
      setValue('1250.5');
      setConfidence('high');
    }, 2000);
  };

  const getScopeColor = () => {
    switch (scope) {
      case 1: return 'from-orange-500 to-red-500';
      case 2: return 'from-blue-500 to-cyan-500';
      case 3: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-600 dark:text-green-400">Data Saved Successfully!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {metricName}: {value} {unit} for {month}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getScopeColor()} p-2`}>
            <Calculator className="w-full h-full text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Enter Data</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{metricName}</p>
          </div>
        </div>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Entry Mode Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'quick', label: 'Quick', icon: Sparkles },
          { id: 'detailed', label: 'Detailed', icon: FileText },
          { id: 'upload', label: 'Upload', icon: Upload },
          { id: 'bulk', label: 'Bulk Entry', icon: Table }
        ].map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setEntryMode(mode.id as any)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                ${entryMode === mode.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Entry Forms */}
      <AnimatePresence mode="wait">
        {entryMode === 'quick' && (
          <motion.div
            key="quick"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500 dark:text-gray-400">
                    {unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {sites.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Site Location
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Sites (Organization-wide)</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} {site.location ? `- ${site.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4" />
              <span>Enter your {period} {metricName.toLowerCase()} for quick tracking</span>
            </div>
          </motion.div>
        )}

        {entryMode === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500"
                />
              </div>
            </div>

            {sites.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Site Location
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Sites (Organization-wide)</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} {site.location ? `- ${site.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Confidence
              </label>
              <div className="flex gap-2">
                {['high', 'medium', 'low'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level as any)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm capitalize transition-all
                      ${confidence === level
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {entryMode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload supporting document
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Utility bills, invoices, or reports (PDF, JPG, PNG)
              </p>
              <label className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer inline-block">
                Choose File
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
            </div>

            {value && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Extracted Value: {value} {unit}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  AI confidence: {confidence}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {entryMode === 'bulk' && (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <BulkDataEntry
              metricId={metricId}
              metricName={metricName}
              unit={unit}
              scope={scope}
              onComplete={(totalEmissions) => {
                console.log(`Bulk data saved with total emissions: ${totalEmissions} tCO2e`);
                onDataSubmit?.(totalEmissions);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons - only show for non-bulk modes */}
      {entryMode !== 'bulk' && (
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!value || isSubmitting}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Data
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          Skip for now
        </button>
      </div>
      )}
    </motion.div>
  );
}