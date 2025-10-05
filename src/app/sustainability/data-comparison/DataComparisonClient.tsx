'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Database,
  BarChart3
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useTranslations } from '@/providers/LanguageProvider';
import toast from 'react-hot-toast';

interface MonthData {
  month: string;
  monthNumber: number;
  rawRecords: number;
  totalEmissions: number;
  electricity: { value: number; count: number };
  water: { value: number; count: number };
  waste: { value: number; count: number };
  hasMonthSpanningData: boolean;
  uniqueDateRanges: number;
}

export default function DataComparisonPage() {
  useAuthRedirect('/sustainability/data-comparison');
  const { user } = useAuth();
  const t = useTranslations('settings.sustainability.dashboard');
  
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchComparisonData();
      fetchDashboardData();
    }
  }, [user, selectedYear]);

  const fetchComparisonData = async () => {
    try {
      const res = await fetch(`/api/sustainability/data-comparison?year=${selectedYear}`);
      const data = await res.json();
      console.log('📊 Comparison data:', data);
      setComparisonData(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('Failed to load comparison data');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/sustainability/dashboard?range=${selectedYear}&site=all`);
      const data = await res.json();
      console.log('📊 Dashboard data:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SustainabilityLayout selectedView="dataComparison" onSelectView={() => {}}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin accent-text" />
        </div>
      </SustainabilityLayout>
    );
  }

  const dashboardMonthlyTotals = dashboardData?.trendData?.reduce((acc: any, month: any) => {
    acc[month.month] = {
      emissions: month.emissions,
      energy: month.energy,
      water: month.water
    };
    return acc;
  }, {});

  return (
    <SustainabilityLayout selectedView="dataComparison" onSelectView={() => {}}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Comparison Analysis
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Compare data between investigation and dashboard views
            </p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 accent-ring cursor-pointer"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 accent-text" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Raw Data Records
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {comparisonData?.totalRecords || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total records in {selectedYear}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 accent-text" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Months with Data
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {comparisonData?.summary?.monthsWithData || 0} / 12
            </p>
            {comparisonData?.summary?.monthsWithNoData?.length > 0 && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                Missing: {comparisonData.summary.monthsWithNoData.join(', ')}
              </p>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 accent-text" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Emissions
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Raw Sum: <span className="font-bold text-gray-900 dark:text-white">
                  {comparisonData?.dashboardTotals?.totalEmissions || 0} tCO2e
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dashboard: <span className="font-bold text-gray-900 dark:text-white">
                  {dashboardData?.metrics?.totalEmissions?.value || 0} tCO2e
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Monthly Comparison Table */}
        <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Data Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.05]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Raw Records
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Raw Emissions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dashboard Emissions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Difference
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData?.monthlyData?.map((month: MonthData) => {
                  const dashboardEmissions = dashboardMonthlyTotals?.[month.month]?.emissions || 0;
                  const difference = Math.abs(month.totalEmissions - dashboardEmissions);
                  const hasIssue = difference > 0.1 || month.hasMonthSpanningData;
                  
                  return (
                    <tr
                      key={month.month}
                      className="border-b border-gray-100 dark:border-white/[0.02]"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {month.month} {selectedYear}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                        {month.rawRecords}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                        {month.totalEmissions} tCO2e
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                        {dashboardEmissions} tCO2e
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={difference > 0.1 ? 'text-red-500' : 'text-green-500'}>
                          {difference.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasIssue ? (
                          <div className="flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            {month.hasMonthSpanningData && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                Month spanning
                              </span>
                            )}
                          </div>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Issues Summary */}
          {comparisonData?.summary?.monthsWithSpanningData?.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Data Quality Issues Detected
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    The following months have entries that span multiple months: {' '}
                    <span className="font-medium">
                      {comparisonData.summary.monthsWithSpanningData.join(', ')}
                    </span>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This may cause discrepancies in monthly aggregations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Metrics Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Electricity */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Electricity Comparison
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Raw Total:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comparisonData?.dashboardTotals?.electricity || 0} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dashboard:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData?.metrics?.energyConsumption?.value || 0} kWh
                </span>
              </div>
            </div>
          </div>

          {/* Water */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Water Comparison
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Raw Total:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comparisonData?.dashboardTotals?.water || 0} m³
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dashboard:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData?.metrics?.waterUsage?.value || 0} m³
                </span>
              </div>
            </div>
          </div>

          {/* Waste */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Waste Comparison
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Raw Total:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comparisonData?.dashboardTotals?.waste || 0} tons
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dashboard:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData?.metrics?.wasteGenerated?.value || 0} tons
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SustainabilityLayout>
  );
}