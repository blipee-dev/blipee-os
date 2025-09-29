'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingDown,
  Calendar,
  RefreshCw,
  Info,
  ChevronRight,
  BarChart3,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ForecastingPanelProps {
  predictions: any;
  currentEmissions: number;
  onRefresh: () => void;
  selectedSite?: string;
}

export function ForecastingPanel({ predictions, currentEmissions, onRefresh, selectedSite }: ForecastingPanelProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<3 | 6 | 12>(12);
  const [showDetails, setShowDetails] = useState(false);

  if (!predictions || !predictions.predictions) {
    return (
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ML Forecasting
          </h3>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading ML predictions...</p>
          </div>
        </div>
      </div>
    );
  }

  const horizonData = predictions.predictions.slice(0, selectedHorizon);
  const finalPrediction = horizonData[horizonData.length - 1];

  // Handle null or undefined predicted values
  if (!finalPrediction || finalPrediction.predicted == null) {
    return (
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ML Forecasting</h3>
          <button onClick={onRefresh} className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Invalid prediction data</p>
            <p className="text-sm text-gray-400 mt-2">Please refresh to retry</p>
          </div>
        </div>
      </div>
    );
  }

  const reductionPercent = ((currentEmissions - finalPrediction.predicted) / currentEmissions) * 100;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
          <p className="text-white font-semibold">
            {data.month} {data.year}
          </p>
          <p className="text-sm text-green-300">
            Predicted: {data.predicted.toFixed(1)} tCO2e
          </p>
          <p className="text-xs text-gray-400">
            Confidence: {(data.confidence * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400">
            Range: {data.lower_bound.toFixed(1)} - {data.upper_bound.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ML Forecasting
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {predictions.model} model with {(predictions.confidence * 100).toFixed(0)}% confidence
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Horizon Selector */}
      <div className="flex gap-2 mb-4">
        {[3, 6, 12].map(horizon => (
          <button
            key={horizon}
            onClick={() => setSelectedHorizon(horizon as any)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedHorizon === horizon
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            {horizon} Months
          </button>
        ))}
      </div>

      {/* Prediction Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Reduction
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {reductionPercent > 0 ? '-' : '+'}{Math.abs(reductionPercent).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            vs current emissions
          </p>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Emissions
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {finalPrediction.predicted.toFixed(0)} tCO2e
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            by {finalPrediction.month} {finalPrediction.year}
          </p>
        </div>
      </div>

      {/* Forecast Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={horizonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />

          <XAxis
            dataKey="month"
            stroke="#999"
            style={{ fontSize: '11px' }}
          />

          <YAxis
            stroke="#999"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => `${(value / 100).toFixed(0)}`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Confidence bands */}
          <Area
            type="monotone"
            dataKey="upper_bound"
            stroke="transparent"
            fill="#3B82F6"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="lower_bound"
            stroke="transparent"
            fill="#3B82F6"
            fillOpacity={0.1}
          />

          {/* Prediction line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 3 }}
            fill="url(#colorPrediction)"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Feature Importance */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Key Drivers
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {showDetails ? 'Hide' : 'Show'} Details
            <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(predictions.features_importance || {})
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, showDetails ? undefined : 3)
            .map(([feature, importance]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {feature.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(importance as number) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {((importance as number) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              This forecast uses an {predictions.model} neural network trained on 36 months of historical data.
              Predictions become less certain over longer time horizons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}