'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  Ship,
  Plane,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  ArrowUpDown
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

interface LogisticsDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: TimePeriod;
}

interface ShipmentMode {
  mode: 'road' | 'rail' | 'air' | 'sea';
  direction: 'upstream' | 'downstream';
  shipment_count: number;
  total_weight_kg: number;
  avg_distance_km: number;
  emissions_tco2e: number;
  cost: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function LogisticsDashboard({
  organizationId,
  selectedSite,
  selectedPeriod
}: LogisticsDashboardProps) {
  const period = selectedPeriod || {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Year to Date'
  };

  const { logistics, isLoading } = useTransportationDashboard(period, selectedSite, organizationId);

  // Compute dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!logistics.data?.logistics) {
      return {
        shipmentModes: [] as ShipmentMode[],
        totalShipments: 0,
        totalEmissions: 0,
        totalWeight: 0,
        upstreamEmissions: 0,
        downstreamEmissions: 0,
        avgDistance: 0,
        emissionsByMode: [],
        shipmentsByMode: [],
        upstreamVsDownstream: [],
        monthlyTrends: []
      };
    }

    const shipmentModes = logistics.data.logistics as ShipmentMode[];
    const summary = logistics.data.summary || {};

    const totalShipments = summary.total_shipments || 0;
    const totalWeight = summary.total_weight_kg || 0;
    const upstreamEmissions = summary.upstream_emissions_tco2e || 0;
    const downstreamEmissions = summary.downstream_emissions_tco2e || 0;
    const totalEmissions = summary.total_emissions_tco2e || 0;

    const emissionsByMode = shipmentModes.reduce((acc: any[], mode) => {
      const existing = acc.find(item => item.name === mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1));
      if (existing) {
        existing.value += mode.emissions_tco2e || 0;
      } else {
        acc.push({
          name: mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1),
          value: mode.emissions_tco2e || 0
        });
      }
      return acc;
    }, []);

    const shipmentsByMode = shipmentModes.reduce((acc: any[], mode) => {
      const existing = acc.find(item => item.name === mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1));
      if (existing) {
        existing.shipments += mode.shipment_count || 0;
      } else {
        acc.push({
          name: mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1),
          shipments: mode.shipment_count || 0
        });
      }
      return acc;
    }, []);

    const upstreamVsDownstream = [
      { name: 'Upstream', emissions: upstreamEmissions },
      { name: 'Downstream', emissions: downstreamEmissions }
    ];

    return {
      shipmentModes,
      totalShipments,
      totalEmissions,
      totalWeight,
      upstreamEmissions,
      downstreamEmissions,
      avgDistance: 0,
      emissionsByMode,
      shipmentsByMode,
      upstreamVsDownstream,
      monthlyTrends: []
    };
  }, [logistics.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  const hasData = dashboardMetrics.shipmentModes.length > 0;

  const getIcon = (mode: string) => {
    if (mode === 'road') return <Truck className="w-5 h-5" />;
    if (mode === 'rail') return <Activity className="w-5 h-5 text-green-500" />;
    if (mode === 'air') return <Plane className="w-5 h-5" />;
    if (mode === 'sea') return <Ship className="w-5 h-5 text-blue-500" />;
    return <Package className="w-5 h-5" />;
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
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            tCO2e (Scope 3.4 & 3.9)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Shipments</span>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.totalShipments}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {(dashboardMetrics.totalWeight / 1000).toFixed(1)} tonnes
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Upstream</span>
            <ArrowUpDown className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.upstreamEmissions.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            tCO2e (Scope 3.4)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Downstream</span>
            <ArrowUpDown className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardMetrics.downstreamEmissions.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            tCO2e (Scope 3.9)
          </div>
        </motion.div>
      </div>

      {/* Data Collection Notice */}
      {!hasData && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Transportation & Distribution Tracking
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Track freight and logistics to measure Scope 3.4 (upstream) and 3.9 (downstream) transportation emissions.
            Monitor shipments by mode, weight, and distance.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add Shipment Data
          </button>

          {/* Setup Guide */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    What to Track
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <div className="font-semibold mb-2">Scope 3.4 - Upstream Transport</div>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Inbound raw materials</li>
                        <li>Component deliveries</li>
                        <li>Supplier shipments</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Scope 3.9 - Downstream Transport</div>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Product distribution</li>
                        <li>Customer deliveries</li>
                        <li>Returns and reverse logistics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Requirements */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 text-left">
                Required Data for Calculation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700 dark:text-purple-300 text-left">
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Shipment Weight</div>
                    <div className="text-xs">Total weight in kg or tonnes</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Distance Traveled</div>
                    <div className="text-xs">Origin to destination in km</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Transport Mode</div>
                    <div className="text-xs">Road, rail, air, or sea freight</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowUpDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Direction</div>
                    <div className="text-xs">Upstream (inbound) or downstream (outbound)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emission Factors */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-left">
                Typical Emission Factors (gCO2e per tonne-km)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700 dark:text-green-300">
                <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <Ship className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Sea Freight</div>
                  <div className="text-2xl font-bold mt-1">10-40</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">Lowest</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <Activity className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Rail Freight</div>
                  <div className="text-2xl font-bold mt-1">20-50</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">Low</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <Truck className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Road Freight</div>
                  <div className="text-2xl font-bold mt-1">60-150</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Medium</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <Plane className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Air Freight</div>
                  <div className="text-2xl font-bold mt-1">500-1500</div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">Highest</div>
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 text-left">
                Reduction Strategies
              </h4>
              <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300 text-left">
                <li className="flex items-start gap-2">
                  <Ship className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Modal shift:</strong> Switch from air to sea freight where time permits (95% emission reduction)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Intermodal transport:</strong> Combine rail and road for optimal cost and emissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Route optimization:</strong> Consolidate shipments and optimize delivery routes</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Local sourcing:</strong> Reduce transportation distances by sourcing materials closer to production</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* When data is available, show detailed breakdown */}
      {hasData && (
        <>
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Shipments by Mode & Direction
            </h3>
            <div className="space-y-3">
              {dashboardMetrics.shipmentModes.map((shipment, idx) => (
                <motion.div
                  key={`${shipment.mode}-${shipment.direction}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        shipment.mode === 'rail' || shipment.mode === 'sea'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {getIcon(shipment.mode)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {shipment.mode.charAt(0).toUpperCase() + shipment.mode.slice(1)} - {shipment.direction}
                          {(shipment.mode === 'rail' || shipment.mode === 'sea') && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              Lower Carbon
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {shipment.shipment_count} shipments • {(shipment.total_weight_kg / 1000).toFixed(1)} tonnes
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Emissions</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {shipment.emissions_tco2e} tCO2e
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Avg Distance</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {shipment.avg_distance_km > 0 ? `${shipment.avg_distance_km.toLocaleString()} km` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Distance</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {shipment.total_distance_km.toLocaleString()} km
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Intensity</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {shipment.intensity > 0 ? `${shipment.intensity} ${shipment.intensity_unit}` : 'N/A'}
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
                  Emissions by Transport Mode
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
                  Upstream vs Downstream
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardMetrics.upstreamVsDownstream}>
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
                    <Bar dataKey="emissions" fill="#8b5cf6" name="Emissions (tCO2e)" />
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
