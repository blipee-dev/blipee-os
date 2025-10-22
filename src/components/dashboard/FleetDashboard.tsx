'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Truck,
  Battery,
  Fuel,
  TrendingUp,
  TrendingDown,
  MapPin,
  Activity,
  DollarSign,
  Gauge,
  AlertTriangle,
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

interface FleetDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: TimePeriod;
}

interface FleetVehicle {
  vehicle_id: string;
  make: string;
  model: string;
  type: string;
  is_electric: boolean;
  distance_km: number;
  fuel_liters: number;
  emissions_tco2e: number;
  cost: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function FleetDashboard({
  organizationId,
  selectedSite,
  selectedPeriod
}: FleetDashboardProps) {
  const period = selectedPeriod || {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Year to Date'
  };

  const { fleet, isLoading } = useTransportationDashboard(period, selectedSite, organizationId);

  // Compute dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!fleet.data?.fleet) {
      return {
        vehicles: [],
        totalDistance: 0,
        totalEmissions: 0,
        totalCost: 0,
        totalFuel: 0,
        avgEfficiency: 0,
        electricCount: 0,
        vehicleTypes: [],
        emissionsByType: [],
        monthlyTrends: []
      };
    }

    const vehicles = fleet.data.fleet as FleetVehicle[];
    const totalDistance = vehicles.reduce((sum, v) => sum + (v.distance_km || 0), 0);
    const totalEmissions = vehicles.reduce((sum, v) => sum + (v.emissions_tco2e || 0), 0);
    const totalCost = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
    const totalFuel = vehicles.reduce((sum, v) => sum + (v.fuel_liters || 0), 0);
    const electricCount = vehicles.filter(v => v.is_electric).length;

    // Calculate average efficiency (L/100km)
    const avgEfficiency = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;

    // Group by vehicle type
    const typeMap = new Map<string, { count: number; distance: number; emissions: number; cost: number }>();
    vehicles.forEach(v => {
      const type = v.type || 'unknown';
      const existing = typeMap.get(type) || { count: 0, distance: 0, emissions: 0, cost: 0 };
      typeMap.set(type, {
        count: existing.count + 1,
        distance: existing.distance + (v.distance_km || 0),
        emissions: existing.emissions + (v.emissions_tco2e || 0),
        cost: existing.cost + (v.cost || 0)
      });
    });

    const vehicleTypes = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      ...data
    }));

    const emissionsByType = Array.from(typeMap.entries()).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.emissions
    }));

    return {
      vehicles,
      totalDistance,
      totalEmissions,
      totalCost,
      totalFuel,
      avgEfficiency,
      electricCount,
      vehicleTypes,
      emissionsByType,
      monthlyTrends: [] // TODO: Add monthly trend data when available
    };
  }, [fleet.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  const hasData = dashboardMetrics.vehicles.length > 0;

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
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">tCO2e (Scope 1)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Distance Traveled</span>
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.totalDistance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">km</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Fuel Cost</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${dashboardMetrics.totalCost.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dashboardMetrics.totalFuel.toFixed(0)} L fuel
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Fleet Efficiency</span>
            <Gauge className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.avgEfficiency.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            L/100km • {dashboardMetrics.electricCount} EVs
          </div>
        </motion.div>
      </div>

      {/* Vehicle List */}
      {hasData ? (
        <>
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fleet Vehicles ({dashboardMetrics.vehicles.length})
            </h3>
            <div className="space-y-3">
              {dashboardMetrics.vehicles.map((vehicle, idx) => {
                const getIcon = () => {
                  if (vehicle.type === 'truck') return <Truck className="w-5 h-5" />;
                  if (vehicle.is_electric) return <Battery className="w-5 h-5 text-green-500" />;
                  return <Car className="w-5 h-5" />;
                };

                const efficiency = vehicle.distance_km > 0 && vehicle.fuel_liters > 0
                  ? (vehicle.fuel_liters / vehicle.distance_km * 100)
                  : 0;

                return (
                  <motion.div
                    key={vehicle.vehicle_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          vehicle.is_electric
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          {getIcon()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {vehicle.make} {vehicle.model}
                            {vehicle.is_electric && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                Electric
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)} • {vehicle.vehicle_id}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Distance</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {vehicle.distance_km.toLocaleString()} km
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Emissions</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {vehicle.emissions_tco2e.toFixed(2)} tCO2e
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Fuel Cost</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${vehicle.cost.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Efficiency</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {efficiency > 0 ? `${efficiency.toFixed(1)} L/100km` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Charts */}
          {dashboardMetrics.emissionsByType.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Emissions by Vehicle Type
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
                  Fleet Performance by Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardMetrics.vehicleTypes}>
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
                    <Bar dataKey="distance" fill="#3b82f6" name="Distance (km)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Fleet Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start tracking your fleet vehicles to monitor emissions and fuel efficiency
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add Fleet Vehicle
          </button>
        </div>
      )}
    </div>
  );
}
