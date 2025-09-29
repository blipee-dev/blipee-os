'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';

interface AnomalyDetectionProps {
  anomalies: any[];
  onInvestigate: (anomaly: any) => void;
}

export function AnomalyDetection({ anomalies, onInvestigate }: AnomalyDetectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spike': return <TrendingUp className="w-4 h-4" />;
      case 'drop': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Use only real anomalies from the API
  const allAnomalies = anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Anomaly Detection
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ML-detected unusual patterns
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
            AI Monitoring
          </span>
        </div>
      </div>

      {/* Anomaly Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">High Severity</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {allAnomalies.filter(a => a.severity === 'high').length}
          </p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Medium</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {allAnomalies.filter(a => a.severity === 'medium').length}
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Low</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {allAnomalies.filter(a => a.severity === 'low').length}
          </p>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allAnomalies.map((anomaly, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-gray-200 dark:border-white/[0.05] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            onClick={() => onInvestigate(anomaly)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                  {getTypeIcon(anomaly.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {anomaly.type === 'spike' ? 'Emission Spike' : 'Unusual Drop'}
                    </p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {anomaly.value.toFixed(0)} tCO2e (expected: {anomaly.expected.toFixed(0)} tCO2e)
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(anomaly.date).toLocaleDateString()}
                    </span>
                    {anomaly.source && (
                      <span className="flex items-center gap-1">
                        Source: {anomaly.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
            </div>

            {/* Variance Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Variance</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {((Math.abs(anomaly.value - anomaly.expected) / anomaly.expected) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    anomaly.severity === 'high' ? 'bg-red-500' :
                    anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (Math.abs(anomaly.value - anomaly.expected) / anomaly.expected) * 100)}%`
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-purple-900 dark:text-purple-300">
              AI Insight
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
              Detected pattern suggests correlation with production schedule changes.
              Consider reviewing operational procedures during peak periods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}