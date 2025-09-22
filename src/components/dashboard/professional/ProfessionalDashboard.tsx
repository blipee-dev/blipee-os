'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Widget,
  MetricCard,
  ProgressCard,
  ScoreCard,
  EmissionsTracker,
  EnergyMonitor,
  SDGProgress,
  ComplianceStatus
} from '@/lib/visualization/widgets/widget-library';
import { DynamicChart } from '@/lib/visualization/charts/DynamicChart';
import {
  BarChart3, TrendingUp, Globe, Leaf, Shield, Target,
  Calendar, Download, Filter, Settings, RefreshCw, Maximize2
} from 'lucide-react';

interface DashboardData {
  metrics: {
    totalEmissions: number;
    energyConsumption: number;
    waterUsage: number;
    wasteGenerated: number;
    renewablePercentage: number;
    complianceScore: number;
  };
  trends: {
    emissions: { month: string; value: number }[];
    energy: { month: string; value: number }[];
    costs: { month: string; value: number }[];
  };
  breakdown: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  sdgProgress: {
    number: number;
    name: string;
    progress: number;
    color: string;
  }[];
  compliance: {
    name: string;
    status: 'compliant' | 'partial' | 'non-compliant';
    score: number;
  }[];
}

export const ProfessionalDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    // Simulate data loading
    setTimeout(() => {
      setData({
        metrics: {
          totalEmissions: 2847.5,
          energyConsumption: 15234,
          waterUsage: 89456,
          wasteGenerated: 234.5,
          renewablePercentage: 47,
          complianceScore: 92
        },
        trends: {
          emissions: [
            { month: 'Jan', value: 2450 },
            { month: 'Feb', value: 2380 },
            { month: 'Mar', value: 2490 },
            { month: 'Apr', value: 2320 },
            { month: 'May', value: 2290 },
            { month: 'Jun', value: 2210 },
            { month: 'Jul', value: 2150 },
            { month: 'Aug', value: 2180 },
            { month: 'Sep', value: 2120 },
            { month: 'Oct', value: 2090 },
            { month: 'Nov', value: 2050 },
            { month: 'Dec', value: 2010 }
          ],
          energy: [
            { month: 'Jan', value: 18500 },
            { month: 'Feb', value: 17200 },
            { month: 'Mar', value: 16800 },
            { month: 'Apr', value: 16200 },
            { month: 'May', value: 15800 },
            { month: 'Jun', value: 15500 },
            { month: 'Jul', value: 15900 },
            { month: 'Aug', value: 16100 },
            { month: 'Sep', value: 15700 },
            { month: 'Oct', value: 15400 },
            { month: 'Nov', value: 15200 },
            { month: 'Dec', value: 15234 }
          ],
          costs: [
            { month: 'Jan', value: 125000 },
            { month: 'Feb', value: 118000 },
            { month: 'Mar', value: 115000 },
            { month: 'Apr', value: 112000 },
            { month: 'May', value: 109000 },
            { month: 'Jun', value: 107000 },
            { month: 'Jul', value: 108000 },
            { month: 'Aug', value: 109500 },
            { month: 'Sep', value: 106000 },
            { month: 'Oct', value: 104000 },
            { month: 'Nov', value: 102000 },
            { month: 'Dec', value: 101000 }
          ]
        },
        breakdown: {
          scope1: 892.3,
          scope2: 1234.7,
          scope3: 720.5
        },
        sdgProgress: [
          { number: 7, name: 'Affordable Energy', progress: 78, color: 'rgba(252, 195, 11, 0.7)' },
          { number: 9, name: 'Industry & Innovation', progress: 85, color: 'rgba(253, 97, 0, 0.7)' },
          { number: 11, name: 'Sustainable Cities', progress: 72, color: 'rgba(249, 157, 28, 0.7)' },
          { number: 12, name: 'Responsible Consumption', progress: 68, color: 'rgba(191, 139, 46, 0.7)' },
          { number: 13, name: 'Climate Action', progress: 82, color: 'rgba(63, 126, 68, 0.7)' },
          { number: 17, name: 'Partnerships', progress: 90, color: 'rgba(25, 72, 106, 0.7)' }
        ],
        compliance: [
          { name: 'GRI Standards', status: 'compliant', score: 94 },
          { name: 'TCFD', status: 'compliant', score: 91 },
          { name: 'CDP', status: 'partial', score: 78 },
          { name: 'SBTi', status: 'compliant', score: 88 },
          { name: 'ISO 14001', status: 'compliant', score: 96 }
        ]
      });
      setRefreshing(false);
    }, 1000);
  };

  const handleExport = () => {
    console.log('Exporting dashboard...');
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-950 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02]"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Professional Dashboard</h1>
                <p className="text-white/60 text-sm">Comprehensive sustainability metrics and analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
                {(['day', 'week', 'month', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded text-sm capitalize transition-all ${
                      timeRange === range
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setRefreshing(true)}
                className={`p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition-all ${
                  refreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleExport}
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricCard
              title="Total Emissions"
              value={data.metrics.totalEmissions.toFixed(1)}
              unit="tCO2e"
              change={-8.5}
              trend="down"
              icon={<Globe className="w-5 h-5 text-white" />}
              color="rgba(239, 68, 68, 0.7)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MetricCard
              title="Energy Consumption"
              value={data.metrics.energyConsumption}
              unit="MWh"
              change={-5.2}
              trend="down"
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="rgba(251, 146, 60, 0.7)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MetricCard
              title="Water Usage"
              value={(data.metrics.waterUsage / 1000).toFixed(1)}
              unit="m³"
              change={-3.1}
              trend="down"
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="rgba(59, 130, 246, 0.7)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MetricCard
              title="Waste Generated"
              value={data.metrics.wasteGenerated.toFixed(1)}
              unit="tonnes"
              change={-12.3}
              trend="down"
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="rgba(147, 51, 234, 0.7)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MetricCard
              title="Renewable Energy"
              value={data.metrics.renewablePercentage}
              unit="%"
              change={15.8}
              trend="up"
              icon={<Leaf className="w-5 h-5 text-white" />}
              color="rgba(34, 197, 94, 0.7)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <MetricCard
              title="Compliance Score"
              value={data.metrics.complianceScore}
              unit="%"
              change={4.2}
              trend="up"
              icon={<Shield className="w-5 h-5 text-white" />}
              color="rgba(99, 102, 241, 0.7)"
            />
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2"
          >
            <DynamicChart
              type="area"
              title="Emissions Trend"
              subtitle="Monthly CO2 emissions (tCO2e)"
              data={data.trends.emissions}
              options={{ dataKeys: ['value'] }}
              height={300}
              theme="glass"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <EmissionsTracker
              scope1={data.breakdown.scope1}
              scope2={data.breakdown.scope2}
              scope3={data.breakdown.scope3}
              total={data.metrics.totalEmissions}
              target={2500}
            />
          </motion.div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <DynamicChart
              type="bar"
              title="Energy Consumption"
              subtitle="Monthly usage (MWh)"
              data={data.trends.energy}
              options={{ dataKeys: ['value'] }}
              height={250}
              theme="glass"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <DynamicChart
              type="line"
              title="Operational Costs"
              subtitle="Monthly costs ($)"
              data={data.trends.costs}
              options={{ dataKeys: ['value'] }}
              height={250}
              theme="glass"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <ComplianceStatus frameworks={data.compliance} />
          </motion.div>
        </div>

        {/* SDG Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <SDGProgress goals={data.sdgProgress} />
        </motion.div>

        {/* Progress Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <ProgressCard
            title="Annual Emissions Target"
            current={data.metrics.totalEmissions}
            target={3000}
            unit="tCO2e"
            color="rgba(239, 68, 68, 0.7)"
          />
          <ProgressCard
            title="Energy Reduction Goal"
            current={15}
            target={20}
            unit="%"
            color="rgba(251, 146, 60, 0.7)"
          />
          <ProgressCard
            title="Water Conservation"
            current={12}
            target={15}
            unit="%"
            color="rgba(59, 130, 246, 0.7)"
          />
          <ProgressCard
            title="Zero Waste Progress"
            current={68}
            target={100}
            unit="%"
            color="rgba(34, 197, 94, 0.7)"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;