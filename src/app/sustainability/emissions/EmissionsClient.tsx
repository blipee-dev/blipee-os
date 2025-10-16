'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Target,
  Calendar,
  Download,
  Filter,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { EmissionsTrend } from '@/components/sustainability/emissions/EmissionsTrend';
import { ForecastingPanel } from '@/components/sustainability/emissions/ForecastingPanel';
import { ReductionScenarios } from '@/components/sustainability/emissions/ReductionScenarios';
import { EmissionsHeatmap } from '@/components/sustainability/emissions/EmissionsHeatmap';
import { AnomalyDetection } from '@/components/sustainability/emissions/AnomalyDetection';
import { ManageDataButton } from '@/components/sustainability/ManageDataButton';

interface EmissionsData {
  current: {
    total: number;
    scope1: number;
    scope2: number;
    scope3: number;
    trend: number;
    intensity: number;
  };
  historical: any[];
  forecast: any[];
  anomalies: any[];
  totalAreaM2?: number;
}

export default function EmissionsClient() {
  useAuthRedirect('/sustainability/emissions');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('emissions');
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  const [selectedMetric, setSelectedMetric] = useState('absolute');
  const [selectedSite, setSelectedSite] = useState('all');
  const [sites, setSites] = useState<any[]>([]);
  const [emissionsData, setEmissionsData] = useState<EmissionsData | null>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);
  const [showMLInsights, setShowMLInsights] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSites();
      fetchEmissionsData();
      fetchMLPredictions();
    }
  }, [user]);

  useEffect(() => {
    if (user && sites.length > 0) {
      fetchEmissionsData();
      fetchMLPredictions();
    }
  }, [selectedPeriod, selectedSite]);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchEmissionsData = async () => {
    try {
      const response = await fetch(`/api/sustainability/emissions?period=${selectedPeriod}&site=${selectedSite}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emissions data');
      }

      const data = await response.json();

      setEmissionsData({
        current: data.current,
        historical: data.historical || [],
        forecast: [], // Will be populated by ML predictions
        anomalies: data.anomalies || [],
        totalAreaM2: data.totalAreaM2 || 0
      });
    } catch (error) {
      console.error('Error fetching emissions data:', error);
      toast.error('Failed to load emissions data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          modelType: 'emissions-forecast',
          siteId: selectedSite === 'all' ? null : selectedSite,
          period: selectedPeriod,
          totalAreaM2: emissionsData?.totalAreaM2 || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle the response structure correctly : [],
          hasPredictions: !!data.predictions,
          siteFilter: selectedSite !== 'all' ? selectedSite : 'all sites'
        });

        if (data.success && data.prediction) {
          setMlPredictions(data.prediction);
        } else if (data.predictions) {
          // Direct predictions format
          setMlPredictions(data);
        } else {
          // Set the prediction data even if structure is different
          if (data.prediction) {
            setMlPredictions(data.prediction);
          }
        }
      } else {
        // Handle API errors (like insufficient data for individual sites)
        const errorData = await response.json();
        if (response.status === 500 && errorData.details?.includes('Insufficient historical data')) {
          setMlPredictions(null); // Clear predictions for sites with insufficient data
        } else {
          console.error('ML API error:', errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
      // No fallback - we only use real predictions or nothing
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (!emissionsData) {
      return (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No emissions data available</p>
        </div>
      );
    }

    // Calculate projected change ONLY if we have real ML predictions
    let projectedChange = null;
    let hasMlPredictions = false;

    if (mlPredictions?.predictions && mlPredictions.predictions.length > 0) {
      // Calculate the sum of all 12 predicted months
      const totalPredicted = mlPredictions.predictions.reduce((sum: number, p: any) =>
        sum + (p.predicted || 0), 0
      );

      if (totalPredicted > 0 && emissionsData.current.total > 0) {
        // Compare 12-month current to 12-month predicted
        projectedChange = ((totalPredicted - emissionsData.current.total) / emissionsData.current.total) * 100;
        hasMlPredictions = true;

        // Log to verify we have real predictions
      }
    }

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {emissionsData.current.total < 1000
                ? emissionsData.current.total.toFixed(1)
                : (emissionsData.current.total / 1000).toFixed(1) + 'k'} tCO2e
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${emissionsData.current.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {emissionsData.current.trend > 0 ? '+' : ''}{emissionsData.current.trend.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">vs last year</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Intensity</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {emissionsData.current.intensity < 1
                ? emissionsData.current.intensity.toFixed(2)
                : emissionsData.current.intensity.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              kgCO2e/m²
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">ML Forecast</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {hasMlPredictions ? (
                <>
                  {projectedChange > 0 ? '+' : ''}{projectedChange.toFixed(1)}%
                </>
              ) : (
                <span className="text-sm text-gray-400">
                  {selectedSite !== 'all' ? 'Insufficient data' : 'Training...'}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {hasMlPredictions ? 'Next 12 months' : selectedSite !== 'all' ? 'For this site' : 'Analyzing data'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-500">Target</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              -42%
            </div>
            <div className="text-sm text-yellow-500 mt-2">
              By 2030 (SBTi)
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-500">Anomalies</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {emissionsData.anomalies.length}
            </div>
            <div className="text-sm text-red-500 mt-2">
              Detected this month
            </div>
          </motion.div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emissions Trend with ML Forecast */}
          <EmissionsTrend
            historicalData={emissionsData.historical}
            forecastData={mlPredictions?.predictions || []}
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            totalAreaM2={emissionsData.totalAreaM2}
            scope1Forecast={mlPredictions?.scope1Forecast || []}
            scope2Forecast={mlPredictions?.scope2Forecast || []}
            scope3Forecast={mlPredictions?.scope3Forecast || []}
            sbtiTarget={emissionsData.sbtiTarget}
          />

          {/* Forecasting Panel */}
          <ForecastingPanel
            predictions={mlPredictions}
            currentEmissions={emissionsData.current.total}
            onRefresh={fetchMLPredictions}
            selectedSite={selectedSite}
          />
        </div>

        {/* Reduction Scenarios */}
        <div className="mt-6">
          <ReductionScenarios
            currentEmissions={emissionsData.current}
            predictions={mlPredictions}
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Emissions Heatmap */}
          <EmissionsHeatmap
            data={emissionsData.historical}
          />

          {/* Anomaly Detection */}
          <AnomalyDetection
            anomalies={emissionsData.anomalies}
            onInvestigate={(anomaly) =>}
          />
        </div>

        {/* ML Insights Panel */}
        {showMLInsights && mlPredictions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI-Powered Insights
                </h3>
              </div>
              <button
                onClick={() => setShowMLInsights(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Drivers
                </p>
                <div className="space-y-1">
                  {Object.entries(mlPredictions.features_importance || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([feature, importance]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {feature.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          {((importance as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model Performance
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Confidence</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {(mlPredictions.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Model</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {mlPredictions.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Training Data</span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      36 months
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recommendations
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Focus on energy efficiency</li>
                  <li>• Optimize production schedules</li>
                  <li>• Review HVAC settings</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Emissions Analysis
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track, forecast, and optimize your carbon footprint with AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Manage Data Button */}
            <ManageDataButton variant="compact" />

            {/* Site Selector */}
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>

            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>

            {/* ML Toggle */}
            <button
              onClick={() => setShowMLInsights(!showMLInsights)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showMLInsights
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'border border-gray-300 dark:border-white/[0.1] text-gray-700 dark:text-gray-300'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Insights
            </button>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {renderContent()}
      </main>
    </SustainabilityLayout>
  );
}