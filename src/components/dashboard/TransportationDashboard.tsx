'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Plane,
  Train,
  Truck,
  Navigation,
  Users,
  Battery,
  Fuel,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  Bot,
  MapPin,
  Package
} from 'lucide-react';

interface TransportationDashboardProps {
  organizationId: string;
}

interface TransportMode {
  name: string;
  category: 'fleet' | 'business' | 'commute' | 'logistics';
  distance: number;
  fuelConsumed: number;
  fuelUnit: string;
  emissions: number;
  cost: number;
  trips: number;
  efficiency: number;
  trend: number;
  icon: React.ReactNode;
}

export function TransportationDashboard({ organizationId }: TransportationDashboardProps) {
  const [viewMode, setViewMode] = useState<'fleet' | 'travel' | 'commute' | 'logistics'>('fleet');
  const [loading, setLoading] = React.useState(true);
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);

  const [commuteModes] = useState<TransportMode[]>([
    {
      name: 'Placeholder for Commute Data',
      category: 'commute',
      distance: 0,
      fuelConsumed: 0,
      fuelUnit: 'trips',
      emissions: 0,
      cost: 0,
      trips: 15,
      efficiency: 10.0,
      trend: -5.1,
      icon: <Car className="w-5 h-5" />
    },
    // Employee Commute (Scope 3)
    {
      name: 'Personal Vehicles',
      category: 'commute',
      distance: 45000,
      fuelConsumed: 4500,
      fuelUnit: 'L',
      emissions: 11.7,
      cost: 0, // Company doesn't pay
      trips: 4500, // Daily trips
      efficiency: 10.0,
      trend: -8.2,
      icon: <Car className="w-5 h-5" />
    },
    {
      name: 'Public Transit',
      category: 'commute',
      distance: 20000,
      fuelConsumed: 0,
      fuelUnit: 'trips',
      emissions: 0.8,
      cost: 500, // Subsidies
      trips: 2000,
      efficiency: 0.04,
      trend: 12.5,
      icon: <Train className="w-5 h-5" />
    },
    {
      name: 'Remote Work',
      category: 'commute',
      distance: 0,
      fuelConsumed: 0,
      fuelUnit: 'days',
      emissions: -3.5, // Avoided
      cost: -2000, // Saved
      trips: 0,
      efficiency: 0,
      trend: 35.8,
      icon: <Users className="w-5 h-5" />
    },
    // Logistics (Scope 3)
    {
      name: 'Inbound Freight',
      category: 'logistics',
      distance: 50000,
      fuelConsumed: 0,
      fuelUnit: 't-km',
      emissions: 12.5,
      cost: 8500,
      trips: 120,
      efficiency: 0.25,
      trend: 3.2,
      icon: <Truck className="w-5 h-5" />
    },
    {
      name: 'Outbound Shipping',
      category: 'logistics',
      distance: 35000,
      fuelConsumed: 0,
      fuelUnit: 't-km',
      emissions: 8.8,
      cost: 6200,
      trips: 200,
      efficiency: 0.25,
      trend: -2.1,
      icon: <Package className="w-5 h-5" />
    }
  ]);

  const [optimizationMetrics] = useState({
    fleetUtilization: 72,
    emptyRunning: 18,
    averageOccupancy: 2.3,
    modalShift: 15, // % shifted to lower carbon modes
    routeEfficiency: 85
  });

  const [aiInsights] = useState([
    { type: 'optimization', message: 'Route optimization could reduce fleet emissions by 15%' },
    { type: 'transition', message: 'EV transition for 5 vehicles would cut 80% emissions' },
    { type: 'behavior', message: 'Carpooling program could reduce commute emissions by 30%' },
    { type: 'logistics', message: 'Consolidating shipments would save $2,000/month' }
  ]);

  // Fetch transportation data
  React.useEffect(() => {
    const fetchTransportData = async () => {
      setLoading(true);
      try {
        // Fetch fleet data
        const fleetRes = await fetch('/api/transportation/fleet');
        const fleetData = await fleetRes.json();

        // Fetch business travel data
        const travelRes = await fetch('/api/transportation/business-travel');
        const travelData = await travelRes.json();

        const modes: TransportMode[] = [];

        // Map fleet data
        if (fleetData.fleet) {
          fleetData.fleet.forEach((v: any) => {
            const getIcon = (type: string) => {
              if (type === 'truck') return <Truck className="w-5 h-5" />;
              if (type === 'electric' || type === 'hybrid') return <Battery className="w-5 h-5" />;
              return <Car className="w-5 h-5" />;
            };

            modes.push({
              name: `${v.make} ${v.model}` || v.vehicle_id,
              category: 'fleet',
              distance: v.distance_km || 0,
              fuelConsumed: v.fuel_liters || 0,
              fuelUnit: v.is_electric ? 'kWh' : 'L',
              emissions: v.emissions_tco2e || 0,
              cost: v.cost || 0,
              trips: 0, // TODO: Add trip tracking
              efficiency: v.distance_km && v.fuel_liters ? (v.fuel_liters / v.distance_km * 100) : 0,
              trend: 0, // TODO: Calculate from historical
              icon: getIcon(v.type)
            });
          });
        }

        // Map business travel data
        if (travelData.travel) {
          travelData.travel.forEach((t: any) => {
            const getIcon = (type: string) => {
              if (type === 'air') return <Plane className="w-5 h-5" />;
              if (type === 'rail') return <Train className="w-5 h-5" />;
              if (type === 'road') return <Car className="w-5 h-5" />;
              return <Navigation className="w-5 h-5" />;
            };

            modes.push({
              name: `${t.type.charAt(0).toUpperCase()}${t.type.slice(1)} Travel`,
              category: 'business',
              distance: t.distance_km || 0,
              fuelConsumed: 0,
              fuelUnit: 'trips',
              emissions: t.emissions_tco2e || 0,
              cost: t.cost || 0,
              trips: t.trip_count || 0,
              efficiency: t.distance_km ? (t.emissions_tco2e / t.distance_km) : 0,
              trend: 0, // TODO: Calculate from historical
              icon: getIcon(t.type)
            });
          });
        }

        setTransportModes(modes);
      } catch (error) {
        console.error('Error fetching transportation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransportData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Calculate totals by category
  const calculateCategoryTotals = (category: string) => {
    const filtered = transportModes.filter(m => m.category === category);
    return {
      distance: filtered.reduce((sum, m) => sum + m.distance, 0),
      emissions: filtered.reduce((sum, m) => sum + m.emissions, 0),
      cost: filtered.reduce((sum, m) => sum + m.cost, 0),
      trips: filtered.reduce((sum, m) => sum + m.trips, 0)
    };
  };

  const fleetTotals = calculateCategoryTotals('fleet');
  const travelTotals = calculateCategoryTotals('business');
  const commuteTotals = calculateCategoryTotals('commute');
  const logisticsTotals = calculateCategoryTotals('logistics');

  const totalEmissions = transportModes.reduce((sum, mode) => sum + mode.emissions, 0);
  const totalCost = transportModes.reduce((sum, mode) => sum + mode.cost, 0);
  const totalDistance = transportModes.reduce((sum, mode) => sum + mode.distance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-7 h-7 text-purple-500" />
              Transportation Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fleet, business travel, commuting, and logistics emissions tracking
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['fleet', 'travel', 'commute', 'logistics'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Fleet (Scope 1)</span>
              <Car className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {fleetTotals.emissions.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {fleetTotals.distance.toLocaleString()} km
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Travel (Scope 3)</span>
              <Plane className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {travelTotals.emissions.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {travelTotals.trips} trips
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Commute (Scope 3)</span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {commuteTotals.emissions.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-green-500 mt-1">
              -30% remote work
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Logistics (Scope 3)</span>
              <Truck className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {logisticsTotals.emissions.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {logisticsTotals.trips} shipments
            </div>
          </div>
        </div>
      </div>

      {/* Main View based on selected mode */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {viewMode === 'fleet' && 'Fleet Vehicles (Scope 1)'}
          {viewMode === 'travel' && 'Business Travel (Scope 3.6)'}
          {viewMode === 'commute' && 'Employee Commuting (Scope 3.7)'}
          {viewMode === 'logistics' && 'Transportation & Distribution (Scope 3.4 & 3.9)'}
        </h3>

        <div className="space-y-3">
          {transportModes
            .filter(mode =>
              (viewMode === 'fleet' && mode.category === 'fleet') ||
              (viewMode === 'travel' && mode.category === 'business') ||
              (viewMode === 'commute' && mode.category === 'commute') ||
              (viewMode === 'logistics' && mode.category === 'logistics')
            )
            .map((mode, idx) => (
              <motion.div
                key={mode.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mode.name.includes('EV') || mode.name.includes('Rail') || mode.name.includes('Remote')
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {mode.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {mode.name}
                        {(mode.name.includes('EV') || mode.name.includes('Remote')) && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            Low Carbon
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {mode.distance > 0 ? `${mode.distance.toLocaleString()} km` : 'N/A'} •
                        {mode.trips} {mode.category === 'commute' ? 'trips/mo' : 'trips'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {mode.trend > 0 ? (
                      <TrendingUp className={`w-4 h-4 ${mode.emissions < 0 ? 'text-green-500' : 'text-red-500'}`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 ${mode.emissions < 0 ? 'text-red-500' : 'text-green-500'}`} />
                    )}
                    <span className={`text-sm ${
                      (mode.trend > 0 && mode.emissions >= 0) || (mode.trend < 0 && mode.emissions < 0)
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`}>
                      {mode.trend > 0 ? '+' : ''}{mode.trend}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Emissions</span>
                    <div className={`font-semibold ${mode.emissions < 0 ? 'text-green-600' : 'text-gray-900'} dark:text-white`}>
                      {mode.emissions} tCO2e
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cost</span>
                    <div className={`font-semibold ${mode.cost < 0 ? 'text-green-600' : 'text-gray-900'} dark:text-white`}>
                      ${Math.abs(mode.cost).toLocaleString()}
                      {mode.cost < 0 && ' saved'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {mode.fuelUnit === 'L' ? 'Fuel' :
                       mode.fuelUnit === 'kWh' ? 'Energy' :
                       mode.fuelUnit === 'trips' ? 'Avg Distance' :
                       'Efficiency'}
                    </span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {mode.fuelConsumed > 0 ?
                        `${mode.fuelConsumed} ${mode.fuelUnit}` :
                        mode.distance > 0 && mode.trips > 0 ?
                        `${Math.round(mode.distance / mode.trips)} km/trip` :
                        'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Intensity</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {mode.distance > 0 ?
                        `${((mode.emissions * 1000) / mode.distance).toFixed(1)} gCO2/km` :
                        'N/A'
                      }
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transportation Optimization
        </h3>

        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizationMetrics.fleetUtilization}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Fleet Utilization</div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500"
                style={{ width: `${optimizationMetrics.fleetUtilization}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizationMetrics.emptyRunning}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Empty Running</div>
            <div className="text-xs text-red-500 mt-1">Target: &lt;10%</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizationMetrics.averageOccupancy}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Occupancy</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">people/vehicle</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizationMetrics.modalShift}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Modal Shift</div>
            <div className="text-xs text-green-500 mt-1">To low-carbon</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizationMetrics.routeEfficiency}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Route Efficiency</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimized</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Transportation Optimization AI</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {aiInsights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-2">
                {insight.type === 'optimization' && <Navigation className="w-4 h-4 text-purple-400 mt-0.5" />}
                {insight.type === 'transition' && <Battery className="w-4 h-4 text-green-400 mt-0.5" />}
                {insight.type === 'behavior' && <Users className="w-4 h-4 text-blue-400 mt-0.5" />}
                {insight.type === 'logistics' && <Package className="w-4 h-4 text-orange-400 mt-0.5" />}
                <p className="text-sm text-gray-300">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all">
          Ask AI for Fleet Optimization Plan
        </button>
      </div>
    </div>
  );
}