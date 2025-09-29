'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Factory,
  Zap,
  Truck,
  Users,
  Building2,
  ShoppingBag,
  Plane,
  Package,
  Recycle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { ScopeBreakdown } from '@/components/sustainability/scope-analysis/ScopeBreakdown';
import { CategoryDrilldown } from '@/components/sustainability/scope-analysis/CategoryDrilldown';
import { EmissionSources } from '@/components/sustainability/scope-analysis/EmissionSources';
import { GHGProtocolCompliance } from '@/components/sustainability/scope-analysis/GHGProtocolCompliance';
import { Scope3Categories } from '@/components/sustainability/scope-analysis/Scope3Categories';

interface ScopeData {
  scope_1: {
    total: number;
    categories: {
      stationary_combustion: number;
      mobile_combustion: number;
      process_emissions: number;
      fugitive_emissions: number;
    };
    trend: number;
    sources: any[];
  };
  scope_2: {
    total: number;
    categories: {
      purchased_electricity: number;
      purchased_heat: number;
      purchased_steam: number;
      purchased_cooling: number;
    };
    location_based: number;
    market_based: number;
    trend: number;
    sources: any[];
  };
  scope_3: {
    total: number;
    categories: {
      [key: string]: {
        value: number;
        included: boolean;
        data_quality: number;
      };
    };
    trend: number;
    coverage: number;
  };
}

export default function ScopeAnalysisClient() {
  useAuthRedirect('/sustainability/scope-analysis');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('scope-analysis');
  const [selectedScope, setSelectedScope] = useState<'all' | '1' | '2' | '3'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [scopeData, setScopeData] = useState<ScopeData | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    if (user) {
      fetchScopeData();
    }
  }, [user, selectedPeriod]);

  const fetchScopeData = async () => {
    try {
      const response = await fetch(`/api/sustainability/scope-analysis?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch scope data');
      const data = await response.json();
      setScopeData(data.scopeData);
      setComplianceScore(data.complianceScore || 0);
    } catch (error) {
      console.error('Error fetching scope data:', error);
      toast.error('Failed to load scope data');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = () => {
    if (complianceScore >= 90) return { label: 'Excellent', color: 'text-green-500', icon: <CheckCircle /> };
    if (complianceScore >= 70) return { label: 'Good', color: 'text-blue-500', icon: <TrendingUp /> };
    if (complianceScore >= 50) return { label: 'Needs Improvement', color: 'text-yellow-500', icon: <AlertTriangle /> };
    return { label: 'Non-Compliant', color: 'text-red-500', icon: <AlertTriangle /> };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (!scopeData) {
      return (
        <div className="text-center py-12">
          <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No scope data available</p>
        </div>
      );
    }

    const totalEmissions = scopeData.scope_1.total + scopeData.scope_2.total + scopeData.scope_3.total;
    const complianceStatus = getComplianceStatus();

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
              <Factory className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Scope 1</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scopeData.scope_1.total.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${scopeData.scope_1.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {scopeData.scope_1.trend > 0 ? '+' : ''}{scopeData.scope_1.trend}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-500">Scope 2</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scopeData.scope_2.total.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${scopeData.scope_2.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {scopeData.scope_2.trend > 0 ? '+' : ''}{scopeData.scope_2.trend}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Scope 3</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scopeData.scope_3.total.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${scopeData.scope_3.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {scopeData.scope_3.trend > 0 ? '+' : ''}{scopeData.scope_3.trend}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {(totalEmissions / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-gray-500 mt-2">
              tCO2e
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={complianceStatus.color}>
                {complianceStatus.icon}
              </div>
              <span className="text-sm text-gray-500">GHG Compliance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {complianceScore}%
            </div>
            <div className={`text-sm mt-2 ${complianceStatus.color}`}>
              {complianceStatus.label}
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scope Breakdown */}
          <ScopeBreakdown
            scopeData={scopeData}
            selectedScope={selectedScope}
            onScopeSelect={setSelectedScope}
          />

          {/* Category Drilldown */}
          <CategoryDrilldown
            scopeData={scopeData}
            selectedScope={selectedScope}
          />
        </div>

        {/* Scope 3 Categories Grid */}
        <div className="mt-6">
          <Scope3Categories
            categories={scopeData.scope_3.categories}
            totalScope3={scopeData.scope_3.total}
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Emission Sources */}
          <EmissionSources
            scopeData={scopeData}
            selectedScope={selectedScope}
          />

          {/* GHG Protocol Compliance */}
          <GHGProtocolCompliance
            scopeData={scopeData}
            complianceScore={complianceScore}
          />
        </div>
      </>
    );
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Scope Analysis
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GHG Protocol compliant emissions analysis by scope and category
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Filter Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {renderContent()}
      </main>
    </SustainabilityLayout>
  );
}