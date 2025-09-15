'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
  Calendar,
  Database
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';

interface MigrationResult {
  dryRun?: boolean;
  success?: boolean;
  message: string;
  summary: {
    totalToUpdate?: number;
    totalUpdated?: number;
    issuesFound?: number;
    totalRecords?: number;
  };
  sampleUpdates?: any[];
  issues?: any[];
}

export default function DataMigrationPage() {
  useAuthRedirect('/sustainability/data-migration');
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runMigration = async (dryRun: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sustainability/fix-month-shift?dryRun=${dryRun}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to run migration');
      }

      const result = await res.json();
      setMigrationResult(result);
      
      if (!dryRun && result.success) {
        toast.success('Migration completed successfully!');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(error.message || 'Failed to run migration');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <SustainabilityLayout selectedView="data-migration" onSelectView={() => {}}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Migration Tool
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fix month shift issue in sustainability metrics data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Super Admin Only
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Migration Description */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Month Shift Migration
            </h2>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                This migration fixes the month shift issue where metrics data has incorrect period dates.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  What this migration does:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                  <li>Identifies entries that span two months (e.g., 31/03 to 29/04)</li>
                  <li>Adjusts them to be within a single month (e.g., 01/04 to 30/04)</li>
                  <li>Affects all years and all sites</li>
                  <li>Preserves all other data (values, emissions, etc.)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Migration Actions
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => runMigration(true)}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                Run Dry Run
              </button>
              
              {migrationResult?.dryRun && migrationResult.summary.totalToUpdate > 0 && (
                <button
                  onClick={() => runMigration(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  Execute Migration
                </button>
              )}
            </div>
          </div>

          {/* Migration Results */}
          {migrationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                {migrationResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : migrationResult.dryRun ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {migrationResult.dryRun ? 'Dry Run Results' : 'Migration Results'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {migrationResult.message}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {migrationResult.summary.totalRecords || 0}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">To Update</p>
                  <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                    {migrationResult.summary.totalToUpdate || migrationResult.summary.totalUpdated || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Issues Found</p>
                  <p className="text-2xl font-semibold text-yellow-700 dark:text-yellow-300">
                    {migrationResult.summary.issuesFound || 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">Status</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {migrationResult.dryRun ? 'Preview' : migrationResult.success ? 'Complete' : 'Failed'}
                  </p>
                </div>
              </div>

              {/* Sample Updates */}
              {migrationResult.sampleUpdates && migrationResult.sampleUpdates.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
                  >
                    {showDetails ? 'Hide' : 'Show'} sample updates ({migrationResult.sampleUpdates.length} of {migrationResult.summary.totalToUpdate})
                  </button>
                  
                  {showDetails && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-black/20">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Entry ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Original Period
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              New Period
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                          {migrationResult.sampleUpdates.map((update, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                                {update.id.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(update.original.period_start)} - {formatDate(update.original.period_end)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-green-600 dark:text-green-400">
                                  {formatDate(update.updated.period_start)} - {formatDate(update.updated.period_end)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Issues */}
              {migrationResult.issues && migrationResult.issues.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Issues Found:
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {migrationResult.issues.length} entries have unexpected date patterns and were not updated.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </SustainabilityLayout>
  );
}