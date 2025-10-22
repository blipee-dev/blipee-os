'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plane,
  Train,
  Car,
  Navigation,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  DollarSign,
  Activity,
  Plus,
  BarChart3,
  PieChart as PieChartIcon
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

interface BusinessTravelDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: TimePeriod;
}

interface TravelRecord {
  type: 'air' | 'rail' | 'road';
  distance_km: number;
  emissions_tco2e: number;
  cost: number;
  trip_count: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export function BusinessTravelDashboard({
  organizationId,
  selectedSite,
  selectedPeriod
}: BusinessTravelDashboardProps) {
  const period = selectedPeriod || {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Year to Date'
  };

  const { businessTravel, isLoading } = useTransportationDashboard(period, selectedSite, organizationId);

  // Compute dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!businessTravel.data?.travel) {
      return {
        travelRecords: [],
        totalDistance: 0,
        totalEmissions: 0,
        totalCost: 0,
        totalTrips: 0,
        avgEmissionsPerTrip: 0,
        byType: [],
        emissionsByType: [],
        monthlyTrends: []
      };
    }

    const travelRecords = businessTravel.data.travel as TravelRecord[];
    const totalDistance = travelRecords.reduce((sum, t) => sum + (t.distance_km || 0), 0);
    const totalEmissions = travelRecords.reduce((sum, t) => sum + (t.emissions_tco2e || 0), 0);
    const totalCost = travelRecords.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalTrips = travelRecords.reduce((sum, t) => sum + (t.trip_count || 0), 0);
    const avgEmissionsPerTrip = totalTrips > 0 ? totalEmissions / totalTrips : 0;

    // Group by travel type
    const byType = travelRecords.map(t => ({
      type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      distance: t.distance_km || 0,
      emissions: t.emissions_tco2e || 0,
      cost: t.cost || 0,
      trips: t.trip_count || 0,
      avgDistance: t.trip_count > 0 ? (t.distance_km / t.trip_count) : 0
    }));

    const emissionsByType = travelRecords.map(t => ({
      name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      value: t.emissions_tco2e || 0
    }));

    return {
      travelRecords,
      totalDistance,
      totalEmissions,
      totalCost,
      totalTrips,
      avgEmissionsPerTrip,
      byType,
      emissionsByType,
      monthlyTrends: [] // TODO: Add monthly trend data when available
    };
  }, [businessTravel.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  const hasData = dashboardMetrics.travelRecords.length > 0;

  const getIcon = (type: string) => {
    if (type.toLowerCase() === 'air') return <Plane className="w-5 h-5" />;
    if (type.toLowerCase() === 'rail') return <Train className="w-5 h-5 text-green-500" />;
    if (type.toLowerCase() === 'road') return <Car className="w-5 h-5" />;
    return <Navigation className="w-5 h-5" />;
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
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">tCO2e (Scope 3.6)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Trips</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.totalTrips}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dashboardMetrics.totalDistance.toLocaleString()} km
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Travel Cost</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${dashboardMetrics.totalCost.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${dashboardMetrics.totalTrips > 0 ? (dashboardMetrics.totalCost / dashboardMetrics.totalTrips).toFixed(0) : 0}/trip avg
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Emissions/Trip</span>
            <MapPin className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.avgEmissionsPerTrip.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">tCO2e per trip</div>
        </motion.div>
      </div>

      {/* Travel Breakdown by Type */}
      {hasData ? (
        <>
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Business Travel by Mode
            </h3>
            <div className="space-y-3">
              {dashboardMetrics.byType.map((travel, idx) => (
                <motion.div
                  key={travel.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        travel.type === 'Rail'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {getIcon(travel.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {travel.type} Travel
                          {travel.type === 'Rail' && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              Lower Carbon
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {travel.trips} trips • {travel.distance.toLocaleString()} km
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Emissions</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {travel.emissions.toFixed(2)} tCO2e
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Cost</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${travel.cost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Avg Distance</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {travel.avgDistance > 0 ? `${Math.round(travel.avgDistance)} km` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Intensity</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {travel.distance > 0 ? `${((travel.emissions * 1000) / travel.distance).toFixed(1)} gCO2/km` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Charts */}
          {dashboardMetrics.emissionsByType.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Emissions by Travel Mode
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardMetrics.emissionsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardMetrics.emissionsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Travel Performance by Mode
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardMetrics.byType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="type" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="emissions" fill="#8b5cf6" name="Emissions (tCO2e)" />
                    <Bar dataKey="trips" fill="#3b82f6" name="Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Travel Optimization Recommendations
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <Train className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Consider rail alternatives for short-haul flights (&lt;500km) to reduce emissions by up to 80%</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Implement a virtual meeting policy for trips under 300km to reduce travel frequency</span>
              </li>
              <li className="flex items-start gap-2">
                <Plane className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Choose direct flights when air travel is necessary - they emit 20-30% less than connecting flights</span>
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Business Travel Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start tracking business travel to monitor emissions from air, rail, and road trips
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add Travel Record
          </button>
        </div>
      )}
    </div>
  );
}
