'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  Calendar,
  BarChart3,
  Leaf,
  Building2,
  Users,
  Activity
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { SBTiTracker } from '@/components/sustainability/targets/SBTiTracker';
import { PathwayVisualization } from '@/components/sustainability/targets/PathwayVisualization';
import { InitiativeTracker } from '@/components/sustainability/targets/InitiativeTracker';
import { TargetSettingWizard } from '@/components/sustainability/targets/TargetSettingWizard';
import { ValidationChecklist } from '@/components/sustainability/targets/ValidationChecklist';

interface TargetData {
  id: string;
  target_type: 'near-term' | 'net-zero' | 'renewable-energy' | 'supplier-engagement';
  target_name: string;
  target_scope: string;
  baseline_year: number;
  baseline_emissions: number;
  target_year: number;
  target_reduction_percent: number;
  target_emissions: number;
  annual_reduction_rate: number;
  sbti_validated: boolean;
  target_status: string;
  current_emissions?: number;
  performance_status?: 'on-track' | 'at-risk' | 'off-track' | 'exceeding';
}

export default function TargetsClient() {
  useAuthRedirect('/sustainability/targets');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchTargets();
      fetchMLPredictions();
    }
  }, [user]);

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch targets');
      const data = await response.json();
      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      // Use existing ML predictions
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'emissions-predictor',
          horizon: 30,
          features: ['scope_1', 'scope_2', 'scope_3']
        })
      });
      if (response.ok) {
        const predictions = await response.json();
        setMlPredictions(predictions);
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'exceeding':
      case 'on-track':
        return 'text-green-500';
      case 'at-risk':
        return 'text-yellow-500';
      case 'off-track':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'exceeding':
      case 'on-track':
        return <CheckCircle className="w-5 h-5" />;
      case 'at-risk':
        return <AlertTriangle className="w-5 h-5" />;
      case 'off-track':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (showWizard) {
      return (
        <TargetSettingWizard
          onClose={() => setShowWizard(false)}
          onSave={() => {
            setShowWizard(false);
            fetchTargets();
          }}
        />
      );
    }

    // Calculate summary metrics
    const activeTargets = targets.filter(t => t.target_status === 'validated' || t.target_status === 'committed');
    const onTrackTargets = activeTargets.filter(t => t.performance_status === 'on-track' || t.performance_status === 'exceeding');
    const atRiskTargets = activeTargets.filter(t => t.performance_status === 'at-risk');

    const averageProgress = activeTargets.length > 0
      ? activeTargets.reduce((sum, t) => {
          const progress = t.baseline_emissions && t.current_emissions
            ? ((t.baseline_emissions - t.current_emissions) / (t.baseline_emissions - t.target_emissions)) * 100
            : 0;
          return sum + progress;
        }, 0) / activeTargets.length
      : 0;

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Active Targets</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeTargets.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-green-500">
                {onTrackTargets.length} on track
              </span>
              {atRiskTargets.length > 0 && (
                <span className="text-sm text-yellow-500">
                  {atRiskTargets.length} at risk
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Average Progress</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {averageProgress.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(averageProgress, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Leaf className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">SBTi Status</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {targets.some(t => t.sbti_validated) ? 'Validated' : 'In Progress'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {targets.some(t => t.sbti_validated) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Activity className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm text-gray-500">1.5°C aligned</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Next Milestone</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              Q2 2025
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Annual progress report due
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SBTi Progress Tracker */}
          <SBTiTracker
            targets={targets}
            predictions={mlPredictions}
            onTargetSelect={setSelectedTarget}
          />

          {/* Pathway Visualization */}
          <PathwayVisualization
            targets={targets}
            selectedTarget={selectedTarget}
            predictions={mlPredictions}
          />
        </div>

        {/* Initiative Tracker */}
        <div className="mt-6">
          <InitiativeTracker
            targetId={selectedTarget}
            onRefresh={fetchTargets}
          />
        </div>

        {/* Validation Checklist */}
        {selectedTarget && (
          <div className="mt-6">
            <ValidationChecklist targetId={selectedTarget} />
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowWizard(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-6 h-6" />
        </button>
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
              Sustainability Targets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Science-based targets tracking and management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Target
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