'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingDown,
  ArrowRight,
  Info
} from 'lucide-react';

interface RollbackHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  targetId: string;
  targetName: string;
  onRollbackSuccess: () => void;
}

interface HistoryRecord {
  id: string;
  organization_id: string;
  sustainability_target_id: string;
  replanning_trigger: string;
  previous_target_emissions: number;
  new_target_emissions: number;
  previous_target_year: number;
  new_target_year: number;
  allocation_strategy: string;
  total_initiatives_added: number;
  created_at: string;
  created_by: string;
}

export default function RollbackHistoryModal({
  isOpen,
  onClose,
  organizationId,
  targetId,
  targetName,
  onRollbackSuccess
}: RollbackHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, targetId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sustainability/replan/history?targetId=${targetId}&organizationId=${organizationId}`
      );
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (historyId: string) => {
    if (!confirm('Are you sure you want to rollback this replanning? This will restore the previous target configuration and remove associated metric targets and initiatives.')) {
      return;
    }

    try {
      setRollingBack(historyId);

      const response = await fetch('/api/sustainability/replan/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId,
          organizationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rollback');
      }

      // Success!
      onRollbackSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error rolling back:', error);
      alert(`Rollback failed: ${error.message}`);
    } finally {
      setRollingBack(null);
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'manual': return 'Manual Replanning';
      case 'off_track_alert': return 'Off-Track Alert';
      case 'annual_review': return 'Annual Review';
      case 'strategy_change': return 'Strategy Change';
      case 'external_factor': return 'External Factor';
      default: return trigger;
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'equal': return 'Equal Distribution';
      case 'cost_optimized': return 'Cost Optimized';
      case 'quick_wins': return 'Quick Wins';
      case 'custom': return 'Custom';
      case 'ai_recommended': return 'AI Recommended';
      default: return strategy;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <History className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Replanning History
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {targetName} - View and rollback previous replanning events
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  <p className="text-gray-400">Loading history...</p>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Replanning History
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This target has not been replanned yet. Click "Replan Target" to create your first replanning event.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-200">
                      <p className="font-semibold mb-1">About Rollback</p>
                      <p className="text-blue-800 dark:text-blue-300">
                        Rolling back will restore the previous target configuration and remove all metric targets and initiatives created during that replanning event. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* History Timeline */}
                <div className="space-y-4">
                  {history.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 relative"
                    >
                      {/* Timeline Connector */}
                      {index < history.length - 1 && (
                        <div className="absolute left-8 top-full w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
                      )}

                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <RotateCcw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {getTriggerLabel(record.replanning_trigger)}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(record.created_at).toLocaleDateString()}</span>
                                </div>
                                <span>•</span>
                                <span>{getStrategyLabel(record.allocation_strategy)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRollback(record.id)}
                              disabled={rollingBack === record.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                              {rollingBack === record.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  Rolling back...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-4 h-4" />
                                  Rollback
                                </>
                              )}
                            </button>
                          </div>

                          {/* Changes Grid */}
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Previous Target</div>
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {record.previous_target_emissions.toFixed(1)} tCO2e
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  by {record.previous_target_year}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <ArrowRight className="w-5 h-5 text-gray-400 mr-4" />
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Target</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {record.new_target_emissions.toFixed(1)} tCO2e
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    by {record.new_target_year}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Summary Stats */}
                          <div className="flex items-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-green-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {((record.previous_target_emissions - record.new_target_emissions) / record.previous_target_emissions * 100).toFixed(1)}%
                                <span className="ml-1">additional reduction</span>
                              </span>
                            </div>
                            {record.total_initiatives_added > 0 && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {record.total_initiatives_added} initiatives added
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Rollback actions cannot be undone</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
