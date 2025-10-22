'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Car,
  Train,
  Bike,
  Home,
  TrendingUp,
  TrendingDown,
  MapPin,
  Activity,
  DollarSign,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTransportationDashboard } from '@/hooks/useDashboardData';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface CommuteDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: TimePeriod;
}

interface CommuteMode {
  mode: 'car' | 'public_transit' | 'bike' | 'walk' | 'remote';
  employee_count: number;
  avg_distance_km: number;
  days_per_month: number;
  emissions_tco2e: number;
  cost: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function CommuteDashboard({
  organizationId,
  selectedSite,
  selectedPeriod
}: CommuteDashboardProps) {
  const period = selectedPeriod || {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Year to Date'
  };

  const { commute, isLoading } = useTransportationDashboard(period, selectedSite, organizationId);

  // Compute dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!commute.data?.commute) {
      return {
        commuteModes: [] as CommuteMode[],
        totalEmployees: 0,
        totalEmissions: 0,
        remoteWorkers: 0,
        remoteWorkPercentage: 0,
        avgCommuteDistance: 0,
        emissionsByMode: [],
        employeesByMode: [],
        monthlyTrends: []
      };
    }

    const commuteModes = commute.data.commute as CommuteMode[];
    const totalEmployees = commute.data.summary?.total_employees || 0;
    const remoteWorkers = commute.data.summary?.remote_workers || 0;
    const remoteWorkPercentage = commute.data.summary?.remote_work_percentage || 0;

    const totalEmissions = commuteModes.reduce((sum, m) => sum + (m.emissions_tco2e || 0), 0);
    const totalDistance = commuteModes.reduce((sum, m) => sum + (m.avg_distance_km || 0) * (m.employee_count || 0), 0);
    const avgCommuteDistance = totalEmployees > 0 ? totalDistance / totalEmployees : 0;

    const emissionsByMode = commuteModes.map(m => ({
      name: m.mode.charAt(0).toUpperCase() + m.mode.slice(1),
      value: m.emissions_tco2e || 0
    }));

    const employeesByMode = commuteModes.map(m => ({
      name: m.mode.charAt(0).toUpperCase() + m.mode.slice(1),
      count: m.employee_count || 0
    }));

    return {
      commuteModes,
      totalEmployees,
      totalEmissions,
      remoteWorkers,
      remoteWorkPercentage,
      avgCommuteDistance,
      emissionsByMode,
      employeesByMode,
      monthlyTrends: []
    };
  }, [commute.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  const hasData = dashboardMetrics.commuteModes.length > 0;

  const getIcon = (mode: string) => {
    if (mode === 'car') return <Car className="w-5 h-5" />;
    if (mode === 'public_transit') return <Train className="w-5 h-5 text-green-500" />;
    if (mode === 'bike') return <Bike className="w-5 h-5 text-green-500" />;
    if (mode === 'remote') return <Home className="w-5 h-5 text-green-500" />;
    return <Users className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Emissions</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.totalEmissions.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">tCO2e (Scope 3.7)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Employees</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.totalEmployees}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Active commuters
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Remote Work</span>
            <Home className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.remoteWorkPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-green-500 mt-1">
            {dashboardMetrics.remoteWorkers} employees
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Commute</span>
            <MapPin className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.avgCommuteDistance.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">km per trip</div>
        </motion.div>
      </div>

      {/* Data Collection Notice */}
      {!hasData && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Employee Commute Tracking
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Track employee commuting patterns to measure Scope 3.7 emissions. Collect data on transportation modes,
            distances, and remote work to identify reduction opportunities.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Set Up Commute Survey
          </button>

          {/* Setup Guide */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    How to Collect Commute Data
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold mt-0.5">1.</span>
                      <span>Send employee survey asking for: primary commute mode, distance from home to work, days per week in office</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold mt-0.5">2.</span>
                      <span>Update quarterly or when work patterns change (e.g., new remote work policies)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold mt-0.5">3.</span>
                      <span>Calculate emissions using GHG Protocol emission factors for each transport mode</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold mt-0.5">4.</span>
                      <span>Track trends over time to measure impact of remote work policies and commute benefits</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reduction Strategies */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-left">
                Common Reduction Strategies
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300 text-left">
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Remote Work</div>
                    <div className="text-xs">2-3 days/week can reduce commute emissions by 40-60%</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Train className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Public Transit Subsidies</div>
                    <div className="text-xs">Incentivize lower-carbon commute options</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bike className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Active Transport</div>
                    <div className="text-xs">Bike parking, showers, and bike-share programs</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Carpooling Programs</div>
                    <div className="text-xs">Reduce single-occupancy vehicle trips</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When data is available, show detailed breakdown */}
      {hasData && (
        <>
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Commute Patterns by Mode
            </h3>
            <div className="space-y-3">
              {dashboardMetrics.commuteModes.map((commuteMode, idx) => (
                <motion.div
                  key={commuteMode.mode}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        commuteMode.mode === 'remote' || commuteMode.mode === 'bike' || commuteMode.mode === 'public_transit'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {getIcon(commuteMode.mode)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {commuteMode.mode.charAt(0).toUpperCase() + commuteMode.mode.slice(1).replace('_', ' ')}
                          {(commuteMode.mode === 'remote' || commuteMode.mode === 'bike' || commuteMode.mode === 'public_transit') && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              Low Carbon
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {commuteMode.employee_count} employees • {commuteMode.days_per_month} days/month
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Emissions</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {commuteMode.emissions_tco2e} tCO2e
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Avg Distance</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {commuteMode.avg_distance_km > 0 ? `${commuteMode.avg_distance_km} km` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Distance</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {commuteMode.avg_distance_km * commuteMode.employee_count * commuteMode.days_per_month} km/mo
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Cost</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {commuteMode.cost > 0 ? `$${commuteMode.cost}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Charts */}
          {dashboardMetrics.emissionsByMode.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Emissions by Commute Mode
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardMetrics.emissionsByMode}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardMetrics.emissionsByMode.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Employee Distribution by Mode
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardMetrics.employeesByMode}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="Employees" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
