'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  Save,
  Plus,
  Trash2,
  Upload,
  Download,
  Copy,
  ClipboardPaste,
  Calendar,
  Calculator,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  Building
} from 'lucide-react';
import { targetDatabase } from '@/lib/ai/target-assistant-database';
import { useOrganization } from '@/hooks/useOrganization';
import { useSites } from '@/hooks/useSites';
import toast from 'react-hot-toast';

interface BulkDataEntryProps {
  metricId: string;
  metricName: string;
  unit: string;
  scope: number;
  emissionFactor?: number;
  onComplete?: (totalEmissions: number) => void;
}

interface DataRow {
  id: string;
  period: string;
  value: string;
  emissions?: number;
  isValid: boolean;
  isEdited: boolean;
}

export function BulkDataEntry({
  metricId,
  metricName,
  unit,
  scope,
  emissionFactor = 0.233, // Default emission factor for electricity in kg CO2e/kWh
  onComplete
}: BulkDataEntryProps) {
  const { organizationId } = useOrganization();
  const { sites } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'paste' | 'template'>('table');
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize with last 12 months
    initializeRows();
  }, []);

  useEffect(() => {
    // Calculate total emissions whenever rows change
    const total = dataRows.reduce((sum, row) => {
      if (row.value && !isNaN(parseFloat(row.value))) {
        return sum + (parseFloat(row.value) * emissionFactor);
      }
      return sum;
    }, 0);
    setTotalEmissions(total / 1000); // Convert to tonnes
  }, [dataRows, emissionFactor]);

  const initializeRows = () => {
    const rows: DataRow[] = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7);

      rows.push({
        id: `row-${i}`,
        period,
        value: '',
        emissions: 0,
        isValid: true,
        isEdited: false
      });
    }

    setDataRows(rows);
  };

  const handleValueChange = (rowId: string, value: string) => {
    setDataRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const numValue = parseFloat(value);
        const isValid = value === '' || !isNaN(numValue);
        const emissions = isValid && value ? numValue * emissionFactor : 0;

        return {
          ...row,
          value,
          emissions,
          isValid,
          isEdited: true
        };
      }
      return row;
    }));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    processPastedData(pastedText);
  };

  const processPastedData = (text: string) => {
    const lines = text.trim().split('\n');
    const newRows: DataRow[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[\t,]/); // Support tab or comma separated

      if (parts.length >= 2) {
        // Expecting format: period, value or just values
        const period = parts[0].match(/\d{4}-\d{2}/) ? parts[0] : '';
        const value = parts[1] || parts[0];
        const numValue = parseFloat(value);

        if (!isNaN(numValue)) {
          newRows.push({
            id: `row-${index}`,
            period: period || new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
            value: value,
            emissions: numValue * emissionFactor,
            isValid: true,
            isEdited: true
          });
        }
      } else if (parts.length === 1) {
        // Just values, assign to sequential months
        const value = parts[0];
        const numValue = parseFloat(value);

        if (!isNaN(numValue)) {
          const currentDate = new Date();
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - index, 1);

          newRows.push({
            id: `row-${index}`,
            period: date.toISOString().slice(0, 7),
            value: value,
            emissions: numValue * emissionFactor,
            isValid: true,
            isEdited: true
          });
        }
      }
    });

    if (newRows.length > 0) {
      setDataRows(newRows);
      toast.success(`Pasted ${newRows.length} rows of data`);
      setViewMode('table');
    } else {
      toast.error('Could not parse pasted data. Expected format: period, value');
    }
  };

  const addRow = () => {
    const lastPeriod = dataRows[dataRows.length - 1]?.period;
    let nextPeriod: string;

    if (lastPeriod) {
      const [year, month] = lastPeriod.split('-').map(Number);
      const nextDate = new Date(year, month, 1); // month is 0-indexed in Date constructor
      nextPeriod = nextDate.toISOString().slice(0, 7);
    } else {
      nextPeriod = new Date().toISOString().slice(0, 7);
    }

    const newRow: DataRow = {
      id: `row-${Date.now()}`,
      period: nextPeriod,
      value: '',
      emissions: 0,
      isValid: true,
      isEdited: false
    };

    setDataRows(prev => [...prev, newRow]);
  };

  const removeRow = (rowId: string) => {
    setDataRows(prev => prev.filter(row => row.id !== rowId));
  };

  const handleBulkSave = async () => {
    const validRows = dataRows.filter(row => row.value && row.isValid && row.isEdited);

    if (validRows.length === 0) {
      toast.error('No valid data to save');
      return;
    }

    setIsLoading(true);

    try {
      const bulkData = validRows.map(row => {
        const [year, month] = row.period.split('-');
        const periodStart = `${row.period}-01`;
        const periodEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

        return {
          period: { start: periodStart, end: periodEnd },
          value: parseFloat(row.value),
          unit
        };
      });

      // Note: submitBulkMetricData doesn't exist yet, so we'll submit each row
      let successCount = 0;
      for (const data of bulkData) {
        const success = await targetDatabase.submitMetricData(
          organizationId || 'current-org-id',
          metricId,
          data.value,
          data.unit,
          data.period,
          {
            aiExtracted: false,
            confidence: 0.9,
            source: 'bulk-entry',
            siteId: selectedSiteId === 'all' ? undefined : selectedSiteId
          }
        );
        if (success) successCount++;
      }

      const allSuccess = successCount === bulkData.length;

      if (allSuccess) {
        setShowSuccess(true);
        toast.success(`Saved ${validRows.length} months of data!`);
        onComplete?.(totalEmissions);

        // Reset edited flags
        setDataRows(prev => prev.map(row => ({ ...row, isEdited: false })));

        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else if (successCount > 0) {
        toast.warning(`Saved ${successCount} of ${validRows.length} entries`);
      } else {
        toast.error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving bulk data:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Period (YYYY-MM)', `Value (${unit})`];
    const rows = dataRows.map(row => [row.period, row.value || '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metricName.replace(/\s+/g, '_')}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Template downloaded!');
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
        className="bg-green-500/10 border border-green-500/20 rounded-xl p-6"
      >
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
            Data Saved Successfully!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {dataRows.filter(r => r.value && r.isValid).length} months of {metricName} data
          </p>
          <p className="text-lg font-medium text-gray-900 dark:text-white mt-2">
            Total Emissions: {totalEmissions.toFixed(2)} tCO2e
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getScopeColor()} p-2`}>
              <Table className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Bulk Data Entry</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{metricName} - {unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>
        </div>
      </div>

      {/* Site Selector */}
      {sites.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Location:
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Sites (Organization-wide)</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} {site.location ? `- ${site.location}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {[
            { id: 'table', label: 'Table Entry', icon: FileSpreadsheet },
            { id: 'paste', label: 'Paste Data', icon: ClipboardPaste },
            { id: 'template', label: 'Instructions', icon: AlertCircle }
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                  ${viewMode === mode.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Period
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Value ({unit})
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Emissions (kgCO2e)
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          row.isEdited ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="month"
                            value={row.period}
                            onChange={(e) => {
                              setDataRows(prev => prev.map(r =>
                                r.id === row.id ? { ...r, period: e.target.value } : r
                              ));
                            }}
                            className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-purple-500 rounded"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={row.value}
                            onChange={(e) => handleValueChange(row.id, e.target.value)}
                            placeholder="0.00"
                            className={`w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-purple-500 rounded ${
                              !row.isValid ? 'text-red-500' : ''
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                          {row.emissions ? row.emissions.toFixed(2) : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row Button */}
              <button
                onClick={addRow}
                className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </motion.div>
          )}

          {viewMode === 'paste' && (
            <motion.div
              key="paste"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Paste data from Excel or CSV:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Format: Period (YYYY-MM), Value</li>
                      <li>• Or just paste values (will auto-assign to months)</li>
                      <li>• Supports tab or comma separated</li>
                    </ul>
                  </div>
                </div>
              </div>

              <textarea
                ref={pasteAreaRef}
                onPaste={handlePaste}
                placeholder={`Paste your data here...\n\nExample:\n2024-01, 1250\n2024-02, 1180\n2024-03, 1320`}
                className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              />

              <button
                onClick={() => {
                  if (pasteAreaRef.current?.value) {
                    processPastedData(pasteAreaRef.current.value);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
              >
                <ClipboardPaste className="w-4 h-4" />
                Process Pasted Data
              </button>
            </motion.div>
          )}

          {viewMode === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="prose dark:prose-invert max-w-none">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  How to use Bulk Data Entry
                </h4>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Option 1: Table Entry
                    </h5>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>1. Enter values directly in the table</li>
                      <li>2. Add more rows as needed</li>
                      <li>3. Emissions are calculated automatically</li>
                      <li>4. Click Save All when done</li>
                    </ol>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Option 2: Copy from Excel
                    </h5>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>1. Select your data in Excel (2 columns: period, value)</li>
                      <li>2. Copy (Ctrl+C / Cmd+C)</li>
                      <li>3. Go to "Paste Data" tab</li>
                      <li>4. Paste in the text area (Ctrl+V / Cmd+V)</li>
                    </ol>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Option 3: Use Template
                    </h5>
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>1. Download the CSV template</li>
                      <li>2. Fill in your data</li>
                      <li>3. Copy and paste back here</li>
                    </ol>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Tip:</strong> You can paste just the values, and we'll automatically assign them to the last 12 months.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Summary and Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Entries:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {dataRows.filter(r => r.value && r.isValid).length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Emissions:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                {totalEmissions.toFixed(2)} tCO2e
              </span>
            </div>
          </div>

          <button
            onClick={handleBulkSave}
            disabled={isLoading || dataRows.filter(r => r.value && r.isValid && r.isEdited).length === 0}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Data
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}