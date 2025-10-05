'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
  Grid3x3,
  Rocket,
  Brain,
  X
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { SBTiTracker } from '@/components/sustainability/targets/SBTiTracker';
import { PathwayVisualization } from '@/components/sustainability/targets/PathwayVisualization';
import { InitiativeTracker } from '@/components/sustainability/targets/InitiativeTracker';
import { TargetSettingWizard } from '@/components/sustainability/targets/TargetSettingWizard';
import { TargetSettingWorkflow } from '@/components/sustainability/targets/TargetSettingWorkflow';
import { ValidationChecklist } from '@/components/sustainability/targets/ValidationChecklist';
import { ScenarioSimulator } from '@/components/sustainability/targets/ScenarioSimulator';
import { MetricLevelScenarioSimulator } from '@/components/sustainability/targets/MetricLevelScenarioSimulator';
import { MaterialityMatrix } from '@/components/sustainability/materiality/MaterialityMatrix';
import { TargetSettingAssistant } from '@/components/sustainability/targets/TargetSettingAssistant';

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
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);
  const [currentEmissions, setCurrentEmissions] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [simulatorMode, setSimulatorMode] = useState<'overall' | 'metric'>('overall');
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant' | 'scenarios' | 'materiality' | 'initiatives'>('overview');
  const [showAIBanner, setShowAIBanner] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchTargets();
      fetchMLPredictions();
      fetchEmissionsData();
      fetchSites();
    }
  }, [user]);

  // Check if we should show AI recommendations when data is loaded
  useEffect(() => {
    checkForAutoAnalysis();
  }, [targets, currentEmissions]);

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
      // Use existing ML predictions with correct parameters
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          modelType: 'emissions-forecast',  // Changed from 'model' to 'modelType'
          period: '12m'  // Added period parameter
        })
      });

      if (response.ok) {
        const predictions = await response.json();
        setMlPredictions(predictions);
      } else {
        // Log error details for debugging
        const errorText = await response.text();
        console.error('ML prediction failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  const fetchEmissionsData = async () => {
    try {
      const response = await fetch('/api/sustainability/emissions?period=12m');
      if (response.ok) {
        const data = await response.json();
        setCurrentEmissions(data.current);
      }
    } catch (error) {
      console.error('Error fetching emissions:', error);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
        if (data.organizationId) {
          setOrganizationId(data.organizationId);
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const checkForAutoAnalysis = async () => {
    // Only run if we have emissions data but no targets
    if (currentEmissions && (!targets || targets.length === 0)) {
      // Calculate total emissions
      const totalEmissions = (currentEmissions.scope1 || 0) +
                           (currentEmissions.scope2 || 0) +
                           (currentEmissions.scope3 || 0);

      // If we have significant emissions data, suggest AI analysis
      if (totalEmissions > 0) {
        // Generate AI recommendations based on current data
        const recommendations = {
          totalEmissions,
          suggestedTargets: {
            nearTerm: {
              year: 2030,
              reduction: 42, // SBTi 1.5°C pathway
              absoluteTarget: totalEmissions * 0.58
            },
            longTerm: {
              year: 2050,
              reduction: 90, // Net zero
              absoluteTarget: totalEmissions * 0.10
            }
          },
          message: `We've detected ${totalEmissions.toFixed(0)} kgCO2e in your emissions data. Would you like AI to generate science-based targets aligned with SBTi standards?`
        };

        setAiAnalysisData(recommendations);
        setShowAIBanner(true);
      }
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

    if (showWorkflow) {
      return (
        <TargetSettingWorkflow
          organizationId={organizationId}
          onComplete={(targets) => {
            console.log('Workflow completed with targets:', targets);
            setShowWorkflow(false);
            fetchTargets();
            toast.success('Targets created successfully!');
          }}
          onCancel={() => setShowWorkflow(false)}
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

    const tabs = [
      { id: 'overview', label: 'Overview', icon: Target },
      { id: 'assistant', label: 'AI Assistant', icon: Users },
      { id: 'scenarios', label: 'Scenario Planning', icon: BarChart3 },
      { id: 'materiality', label: 'Material Topics', icon: Grid3x3 },
      { id: 'initiatives', label: 'Initiatives', icon: Rocket }
    ];

    return (
      <div className="space-y-6">
        {/* AI Recommendations Banner */}
        {showAIBanner && aiAnalysisData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    AI Target Recommendations Available
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {aiAnalysisData.message}
                  </p>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">2030 Target:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {aiAnalysisData.suggestedTargets.nearTerm.reduction}% reduction
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">2050 Target:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {aiAnalysisData.suggestedTargets.longTerm.reduction}% reduction
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAIBanner(false);
                    setShowWorkflow(true);
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  Set Targets with AI
                </button>
                <button
                  onClick={() => setShowAIBanner(false)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Glass Morphism Tab Navigation */}
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-1 mb-6">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200
                            ${isActive
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
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

            {/* Validation Checklist */}
            {selectedTarget && (
              <div className="mt-6">
                <ValidationChecklist targetId={selectedTarget} />
              </div>
            )}
            </motion.div>
          )}

          {/* AI Assistant Tab */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TargetSettingAssistant />
            </motion.div>
          )}

          {/* Scenario Planning Tab */}
          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentEmissions ? (
            <>
            {/* Mode Toggle */}
            <div className="flex justify-end mb-4">
              <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSimulatorMode('overall')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                            ${simulatorMode === 'overall'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700/50'
                            }`}
                >
                  Overall Targets
                </button>
                <button
                  onClick={() => setSimulatorMode('metric')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                            ${simulatorMode === 'metric'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700/50'
                            }`}
                >
                  Metric-Level
                </button>
              </div>
            </div>

            {/* Conditional Rendering based on mode */}
            {simulatorMode === 'overall' ? (
              <ScenarioSimulator
                currentEmissions={currentEmissions}
                baselineYear={targets[0]?.baseline_year || 2022}
                sites={sites}
                organizationId={organizationId}
              />
            ) : (
              <MetricLevelScenarioSimulator
                currentEmissions={currentEmissions}
                baselineYear={targets[0]?.baseline_year || 2022}
                sites={sites}
                organizationId={organizationId}
              />
            )}
            </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              )}
            </motion.div>
          )}

          {/* Material Topics Tab */}
          {activeTab === 'materiality' && (
            <motion.div
              key="materiality"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MaterialityMatrix
            organizationId={organizationId}
            industryType="general"
            onTopicSelect={(topic) => {
              console.log('Selected material topic:', topic);
              // Could link to relevant targets or metrics
            }}
              />
            </motion.div>
          )}

          {/* Initiatives Tab */}
          {activeTab === 'initiatives' && (
            <motion.div
              key="initiatives"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InitiativeTracker
            targetId={selectedTarget}
            onRefresh={fetchTargets}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowWizard(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    );
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] p-4 sm:p-6">
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
              onClick={() => setShowWorkflow(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Target className="w-4 h-4" />
              Guided Setup
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Quick Target
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {renderContent()}
      </main>
    </SustainabilityLayout>
  );
}