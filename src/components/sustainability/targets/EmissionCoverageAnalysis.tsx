'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  TrendingUp,
  Target,
  Info,
  Plus,
  ChevronRight,
  Zap,
  Factory,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Globe,
  Building2,
  Users
} from 'lucide-react';
import { industryIntelligence } from '@/lib/ai/industry-intelligence-service';

interface MissingMetric {
  metric: string;
  scope: number;
  importance: 'critical' | 'important' | 'recommended';
  estimatedImpact: number;
  measurementDifficulty: 'easy' | 'moderate' | 'difficult';
  dataSources: string[];
  category?: string;
  unit?: string;
}

interface EmissionCoverageProps {
  organizationId: string;
  industry: string;
  size: string;
  region?: string;
  onMetricAdd?: (metric: any) => void;
}

export function EmissionCoverageAnalysis({
  organizationId,
  industry,
  size,
  region = 'Global',
  onMetricAdd
}: EmissionCoverageProps) {
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<{
    coverageScore: number;
    missingMetrics: MissingMetric[];
    recommendations: string[];
    summary: any;
  } | null>(null);
  const [peerComparison, setPeerComparison] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<MissingMetric | null>(null);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    loadCoverageAnalysis();
    loadPeerComparison();
  }, [organizationId, industry]);

  const loadCoverageAnalysis = async () => {
    try {
      setLoading(true);

      // Get current metrics
      const metricsResponse = await fetch('/api/sustainability/targets/available-metrics');
      const metricsData = await metricsResponse.json();

      const currentMetrics = metricsData.metrics?.map((m: any) => m.name) || [];

      // Perform gap analysis
      const gapResponse = await fetch('/api/ai/intelligence/gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMetrics,
          industry,
          organizationSize: size
        })
      });

      if (gapResponse.ok) {
        const data = await gapResponse.json();
        setCoverageData(data);
      }
    } catch (error) {
      console.error('Failed to load coverage analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPeerComparison = async () => {
    try {
      const comparison = await industryIntelligence.getPeerComparison(industry, size, region);
      setPeerComparison(comparison);
    } catch (error) {
      console.error('Failed to load peer comparison:', error);
    }
  };

  const handleAddMetric = async (metric: MissingMetric) => {
    // Add metric to organization
    if (onMetricAdd) {
      onMetricAdd(metric);
    }

    // Refresh analysis
    await loadCoverageAnalysis();
  };

  const getScopeIcon = (scope: number) => {
    switch (scope) {
      case 1: return <Factory className="w-4 h-4" />;
      case 2: return <Zap className="w-4 h-4" />;
      case 3: return <Package className="w-4 h-4" />;
      default: return null;
    }
  };

  const getScopeColor = (scope: number) => {
    switch (scope) {
      case 1: return 'from-orange-500 to-red-500';
      case 2: return 'from-blue-500 to-cyan-500';
      case 3: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'important': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'recommended': return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'moderate': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'difficult': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coverage Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Emission Coverage Analysis</h3>
            <p className="text-purple-200/80 text-sm">
              Tracking {coverageData?.summary.metricsTracked || 0} of {coverageData?.summary.totalMetricsPossible || 0} possible metrics
            </p>
          </div>
          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {showBenchmarks ? 'Hide' : 'Show'} Benchmarks
          </button>
        </div>

        {/* Main Coverage Score */}
        <div className="relative h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(coverageData?.coverageScore || 0) * 3.52} 352`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{coverageData?.coverageScore || 0}%</span>
            <span className="text-xs text-purple-300">Coverage</span>
          </div>
        </div>

        {/* Gap Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{coverageData?.summary.criticalGaps || 0}</div>
            <div className="text-xs text-gray-400">Critical Gaps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{coverageData?.summary.importantGaps || 0}</div>
            <div className="text-xs text-gray-400">Important Gaps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {100 - (coverageData?.coverageScore || 0)}%
            </div>
            <div className="text-xs text-gray-400">To 100%</div>
          </div>
        </div>

        {/* Peer Comparison */}
        {peerComparison && showBenchmarks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-purple-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">
                Industry Benchmark: {size} {industry} organizations
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Average coverage:</span>
                <span className="text-white">{peerComparison.metricsTracked} metrics</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Scope 3 adoption:</span>
                <span className="text-white">{peerComparison.scopeCoverage.scope3}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Annual reduction:</span>
                <span className="text-white">{peerComparison.averageReduction}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* AI Recommendations */}
      {coverageData?.recommendations && coverageData.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-900/30 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
          </div>
          <div className="space-y-3">
            {coverageData.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Missing Metrics List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Missing Emission Sources</h3>
          <span className="text-sm text-gray-400">
            Click to add metrics
          </span>
        </div>

        <div className="space-y-2">
          {coverageData?.missingMetrics.slice(0, 10).map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer"
              onClick={() => setSelectedMetric(metric)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getScopeColor(metric.scope)} p-1`}>
                      {getScopeIcon(metric.scope)}
                    </div>
                    <span className="text-sm font-medium text-white">{metric.metric}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getImportanceColor(metric.importance)}`}>
                      {metric.importance}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>~{metric.estimatedImpact}% of emissions</span>
                    <div className="flex items-center gap-1">
                      {getDifficultyIcon(metric.measurementDifficulty)}
                      <span>{metric.measurementDifficulty} to measure</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddMetric(metric);
                  }}
                  className="p-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all"
                >
                  <Plus className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {coverageData && coverageData.missingMetrics.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
              View all {coverageData.missingMetrics.length} missing metrics →
            </button>
          </div>
        )}
      </motion.div>

      {/* Metric Detail Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMetric(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedMetric.metric}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">Scope {selectedMetric.scope}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getImportanceColor(selectedMetric.importance)}`}>
                      {selectedMetric.importance}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Impact & Measurement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estimated Impact:</span>
                      <span className="text-white">{selectedMetric.estimatedImpact}% of total emissions</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Measurement Difficulty:</span>
                      <div className="flex items-center gap-1">
                        {getDifficultyIcon(selectedMetric.measurementDifficulty)}
                        <span className="text-white">{selectedMetric.measurementDifficulty}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Data Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMetric.dataSources.map((source, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleAddMetric(selectedMetric);
                      setSelectedMetric(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    Add to Tracked Metrics
                  </button>
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}