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
  Package,
  Info
} from 'lucide-react';

import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface TransportationDashboardProps {
  organizationId: string;
  selectedSite?: Building | null;
  selectedPeriod?: TimePeriod;
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

  // Weighted allocation targets
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);

  // TODO: Fetch commute and logistics data from API when available
  // For now, these are empty - no mock data
  const commuteModes: TransportMode[] = [];
  const logisticsModes: TransportMode[] = [];

  // Fetch transportation data
  React.useEffect(() => {
    const fetchTransportData = async () => {
      setLoading(true);
      try {
        // Fetch fleet data
        const fleetRes = await fetch('/api/transportation/fleet');
        const fleetData = await fleetRes.json();
        console.log('🚗 Fleet API Response:', fleetData);

        // Fetch business travel data
        const travelRes = await fetch('/api/transportation/business-travel');
        const travelData = await travelRes.json();
        console.log('✈️ Business Travel API Response:', travelData);

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
        console.log('📊 Processed Transport Modes:', modes);
        console.log('📈 Total modes count:', modes.length);

        // Fetch weighted allocation targets for transportation categories
        const currentYear = new Date().getFullYear();
        const allocParams = new URLSearchParams({
          baseline_year: (currentYear - 1).toString(),
        });

        const allocRes = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
        const allocData = await allocRes.json();

        if (allocData.allocations) {
          // Filter for transportation-related categories (Business Travel, Employee Commuting, Transport)
          const transportCategories = allocData.allocations.filter((alloc: any) =>
            alloc.category === 'Business Travel' ||
            alloc.category === 'Employee Commuting' ||
            alloc.category === 'Transport'
          );
          setCategoryTargets(transportCategories);
          setOverallTargetPercent(allocData.overallTarget);
          console.log('📊 Transportation Category Targets:', transportCategories);
        }
      } catch (error) {
        console.error('❌ Error fetching transportation data:', error);
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
  // Commute and logistics currently have no data - will be 0
  const commuteTotals = { distance: 0, emissions: 0, cost: 0, trips: 0 };
  const logisticsTotals = { distance: 0, emissions: 0, cost: 0, trips: 0 };

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

      {/* Only show optimization metrics if we have data */}
      {transportModes.length > 0 && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transportation Metrics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalDistance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Distance (km)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Emissions (tCO2e)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalDistance > 0 ? ((totalEmissions * 1000) / totalDistance).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Intensity (gCO2/km)</div>
            </div>
          </div>
        </div>
      )}

      {/* Science-Based Category Targets */}
      {categoryTargets.length > 0 && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Science-Based Target Allocation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Weighted by emission profile, abatement potential, and technology readiness
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {overallTargetPercent?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Overall Target</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {categoryTargets.map((target: any) => (
              <div
                key={target.category}
                className={`border rounded-lg p-4 ${
                  target.feasibility === 'high'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : target.feasibility === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{target.category}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {target.currentEmissions.toFixed(1)} tCO2e ({target.emissionPercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    target.feasibility === 'high'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : target.feasibility === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {target.feasibility} feasibility
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {target.adjustedTargetPercent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      → {target.absoluteTarget.toFixed(1)} tCO2e
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {target.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  How Weighted Allocation Works
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Categories with high emissions AND high abatement potential receive higher reduction targets.
                  This ensures the overall {overallTargetPercent?.toFixed(1)}% target is achievable by focusing efforts where they matter most.
                  Categories are weighted by emission percentage × effort factor (based on technology readiness and cost-effectiveness).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}