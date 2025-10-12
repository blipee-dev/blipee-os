'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  TrendingDown,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit,
  Trash2,
  Award,
  BarChart3,
  LineChart,
  Building2,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  History
} from 'lucide-react';
import { Building, TimePeriod } from '@/types/auth';
import ReplanningModal from '@/components/sustainability/ReplanningModal';
import ReplanningResultsModal from '@/components/sustainability/ReplanningResultsModal';
import TrajectoryModal from '@/components/sustainability/TrajectoryModal';
import EditTargetModal from '@/components/sustainability/EditTargetModal';
import RollbackHistoryModal from '@/components/sustainability/RollbackHistoryModal';

interface TargetsDashboardProps {
  organizationId: string;
  userId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

interface SBTiTarget {
  id: string;
  name: string;
  target_type?: 'near-term' | 'long-term' | 'net-zero';
  scope_coverage?: string[]; // ['scope_1', 'scope_2', 'scope_3']
  baseline_year: number;
  baseline_emissions: number;
  target_year: number;
  target_emissions: number;
  reduction_percentage?: number;
  annual_reduction_rate?: number;
  sbti_validated?: boolean;
  status?: 'on_track' | 'at_risk' | 'off_track' | 'achieved';
  current_emissions?: number;
  progress_percentage?: number;
  performance_status?: string;
  actual_ytd?: number;
  forecasted_remaining?: number;
  is_forecast?: boolean;
  bau_projection_2030?: number;
}

export function TargetsDashboard({
  organizationId,
  userId,
  selectedSite,
  selectedPeriod
}: TargetsDashboardProps) {
  const [targets, setTargets] = useState<SBTiTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replanningTarget, setReplanningTarget] = useState<SBTiTarget | null>(null);
  const [actionPlanTarget, setActionPlanTarget] = useState<SBTiTarget | null>(null);
  const [trajectoryTarget, setTrajectoryTarget] = useState<SBTiTarget | null>(null);
  const [editTarget, setEditTarget] = useState<SBTiTarget | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<SBTiTarget | null>(null);

  useEffect(() => {
    fetchTargets();
  }, [organizationId]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sustainability/targets?organization_id=${organizationId}`);
      const data = await response.json();

      console.log('🎯 Targets from API:', data.targets);

      // Use targets directly from API (already includes calculated + existing merged)
      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
          <p className="text-gray-400">Loading targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Science-Based Targets
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
              Set and track your organization's emissions reduction targets aligned with climate science.
              SBTi provides a clearly-defined pathway for companies to reduce greenhouse gas emissions,
              preventing the worst impacts of climate change.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Target
          </button>
        </div>

        {/* SBTi Info Banner */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-1">What are Science-Based Targets?</p>
              <p className="text-blue-800 dark:text-blue-300">
                Targets are considered 'science-based' if they are in line with what the latest climate science deems
                necessary to meet the goals of the Paris Agreement – limiting global warming to well-below 2°C above
                pre-industrial levels and pursuing efforts to limit warming to 1.5°C.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Targets List - Always show all three target types */}
      <TargetsList
        targets={targets}
        organizationId={organizationId}
        onRefresh={fetchTargets}
        setReplanningTarget={setReplanningTarget}
        setActionPlanTarget={setActionPlanTarget}
        setTrajectoryTarget={setTrajectoryTarget}
        setEditTarget={setEditTarget}
        setRollbackTarget={setRollbackTarget}
      />

      {/* Create Target Modal */}
      {showCreateModal && (
        <CreateTargetModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTargets();
          }}
        />
      )}

      {/* Replanning Modal */}
      {replanningTarget && (
        <ReplanningModal
          isOpen={!!replanningTarget}
          onClose={() => setReplanningTarget(null)}
          organizationId={organizationId}
          targetId={replanningTarget.id}
          targetName={replanningTarget.name}
          baselineYear={replanningTarget.baseline_year}
          baselineEmissions={replanningTarget.baseline_emissions}
          currentYear={new Date().getFullYear()}
          currentEmissions={replanningTarget.current_emissions || replanningTarget.baseline_emissions}
          targetYear={replanningTarget.target_year}
          targetEmissions={replanningTarget.target_emissions}
          onReplanComplete={() => {
            setReplanningTarget(null);
            fetchTargets();
          }}
        />
      )}

      {/* Action Plan Modal */}
      {actionPlanTarget && (
        <ReplanningResultsModal
          isOpen={!!actionPlanTarget}
          onClose={() => setActionPlanTarget(null)}
          organizationId={organizationId}
          targetId={actionPlanTarget.id}
          targetName={actionPlanTarget.name}
        />
      )}

      {/* Trajectory Modal */}
      {trajectoryTarget && (
        <TrajectoryModal
          isOpen={!!trajectoryTarget}
          onClose={() => setTrajectoryTarget(null)}
          organizationId={organizationId}
          target={trajectoryTarget}
        />
      )}

      {/* Edit Target Modal */}
      {editTarget && (
        <EditTargetModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          organizationId={organizationId}
          target={editTarget}
          onSave={() => {
            setEditTarget(null);
            fetchTargets();
          }}
        />
      )}

      {/* Rollback History Modal */}
      {rollbackTarget && (
        <RollbackHistoryModal
          isOpen={!!rollbackTarget}
          onClose={() => setRollbackTarget(null)}
          organizationId={organizationId}
          targetId={rollbackTarget.id}
          targetName={rollbackTarget.name}
          onRollbackSuccess={() => {
            setRollbackTarget(null);
            fetchTargets();
          }}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateTarget }: { onCreateTarget: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-12">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <Target className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No Targets Set Yet
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Start your decarbonization journey by setting science-based emissions reduction targets.
          We'll guide you through the process and help you track your progress.
        </p>

        <button
          onClick={onCreateTarget}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Your First Target
        </button>

        {/* Quick Guide */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Set Baseline</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Establish your emissions baseline year (typically 2-3 years ago)
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-green-600 dark:text-green-400 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Define Target</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set your reduction target aligned with 1.5°C pathway (minimum 42% by 2030)
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Track Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor your emissions reduction progress in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Targets List Component
function TargetsList({
  targets,
  organizationId,
  onRefresh,
  setReplanningTarget,
  setActionPlanTarget,
  setTrajectoryTarget,
  setEditTarget,
  setRollbackTarget
}: {
  targets: SBTiTarget[];
  organizationId: string;
  onRefresh: () => void;
  setReplanningTarget: (target: SBTiTarget | null) => void;
  setActionPlanTarget: (target: SBTiTarget | null) => void;
  setTrajectoryTarget: (target: SBTiTarget | null) => void;
  setEditTarget: (target: SBTiTarget | null) => void;
  setRollbackTarget: (target: SBTiTarget | null) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {(() => {
        // Filter to only committed targets (not calculated recommendations)
        const committedTargets = targets.filter(t => !t.id.startsWith('calculated-'));

        const activeTargets = committedTargets.length;
        const sbtiValidated = committedTargets.filter(t => t.sbti_validated).length;
        const onTrackTargets = committedTargets.filter(t => t.status === 'on_track' || t.status === 'achieved').length;
        const avgProgress = committedTargets.length > 0
          ? Math.round(
              committedTargets.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / committedTargets.length
            )
          : 0;

        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Targets</span>
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeTargets}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Committed targets</p>
            </div>

            <a
              href={sbtiValidated === 0 ? "https://sciencebasedtargets.org/set-a-target" : "https://sciencebasedtargets.org/companies-taking-action"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all group relative"
              title={sbtiValidated === 0 ? "Click to learn about SBTi validation" : "View SBTi validated companies"}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  SBTi Validated
                  {sbtiValidated === 0 && (
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </span>
                <Award className={`w-5 h-5 ${sbtiValidated > 0 ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500 transition-colors'}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {sbtiValidated}
                {sbtiValidated === 0 && (
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sbtiValidated === 0 ? 'Learn about validation' : 'Official validation'}
              </p>
            </a>

            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">On Track</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {onTrackTargets}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Meeting targets</p>
            </div>

            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</span>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgProgress}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall progress</p>
            </div>
          </div>
        );
      })()}

      {/* SBTi Validation Info Banner - Only show if no validated targets */}
      {(() => {
        const committedTargets = targets.filter(t => !t.id.startsWith('calculated-'));
        const hasValidatedTarget = committedTargets.some(t => t.sbti_validated);

        if (!hasValidatedTarget && committedTargets.length > 0) {
          return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Get Your Target SBTi Validated
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Your target aligns with SBTi's 1.5°C pathway requirements. Getting official validation demonstrates
                    your commitment to climate science and gives your stakeholders confidence in your climate strategy.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="https://sciencebasedtargets.org/set-a-target"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Start SBTi Validation Process
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a
                      href="https://sciencebasedtargets.org/resources/files/SBTi-criteria.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      Learn More About SBTi
                      <Info className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Credibility:</strong> Official validation from leading climate body
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Recognition:</strong> Public listing on SBTi website
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Investment:</strong> From $9,500 depending on company size
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Target Cards */}
      <div className="space-y-4">
        {targets.map((target) => (
          <TargetCard
            key={target.id}
            target={target}
            organizationId={organizationId}
            onRefresh={onRefresh}
            setReplanningTarget={setReplanningTarget}
            setActionPlanTarget={setActionPlanTarget}
            setTrajectoryTarget={setTrajectoryTarget}
            setEditTarget={setEditTarget}
            setRollbackTarget={setRollbackTarget}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Target Card
function TargetCard({
  target,
  organizationId,
  onRefresh,
  setReplanningTarget,
  setActionPlanTarget,
  setTrajectoryTarget,
  setEditTarget,
  setRollbackTarget
}: {
  target: SBTiTarget;
  organizationId: string;
  onRefresh: () => void;
  setReplanningTarget: (target: SBTiTarget | null) => void;
  setActionPlanTarget: (target: SBTiTarget | null) => void;
  setTrajectoryTarget: (target: SBTiTarget | null) => void;
  setEditTarget: (target: SBTiTarget | null) => void;
  setRollbackTarget: (target: SBTiTarget | null) => void;
}) {
  const [committing, setCommitting] = useState(false);

  const handleCommitTarget = async () => {
    try {
      setCommitting(true);

      const response = await fetch('/api/sustainability/targets/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: target.name,
          target_type: target.target_type,
          baseline_year: target.baseline_year,
          baseline_value: target.baseline_emissions,
          target_year: target.target_year,
          target_value: target.target_emissions,
          scopes: target.scope_coverage || [],
          methodology: 'SBTi'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to commit target');
      }

      // Refresh the targets list to show the newly committed target
      onRefresh();
    } catch (error) {
      console.error('Error committing target:', error);
      alert('Failed to commit target. Please try again.');
    } finally {
      setCommitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'achieved':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          icon: CheckCircle2,
          label: 'Achieved'
        };
      case 'on_track':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          icon: TrendingDown,
          label: 'On Track'
        };
      case 'at_risk':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          icon: AlertTriangle,
          label: 'At Risk'
        };
      case 'off_track':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          icon: TrendingUp,
          label: 'Off Track'
        };
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-800',
          icon: Target,
          label: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(target.status || 'on_track');
  const StatusIcon = statusConfig.icon;
  const progress = target.progress_percentage || 0;
  const isPlaceholder = target.id.startsWith('placeholder-');
  const isCalculated = target.id.startsWith('calculated-');
  const isEmpty = !isCalculated && target.baseline_emissions === 0;

  // Show simplified empty state ONLY for placeholder targets (not calculated ones)
  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{target.name}</h3>
              {target.target_type && (
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                  {target.target_type === 'near-term' ? 'Near-Term (2030)' : target.target_type === 'long-term' ? 'Long-Term (2050)' : 'Net-Zero (2050)'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(target as any).description ||
                (target.target_type === 'near-term'
                  ? 'Set a 5-10 year emissions reduction target (minimum 42% by 2030)'
                  : target.target_type === 'long-term'
                  ? 'Commit to 90% emissions reduction by 2050'
                  : 'Achieve net-zero emissions by 2050 with permanent carbon removal')}
            </p>
          </div>
          <button
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            onClick={() => {/* TODO: Open edit modal */}}
          >
            <Plus className="w-4 h-4" />
            Set Up Target
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{target.name}</h3>

            {isCalculated && (
              <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">
                Recommended
              </span>
            )}

            {target.sbti_validated && (
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                SBTi
              </span>
            )}

            {target.target_type && (
              <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                {target.target_type === 'near-term' ? 'Near-Term' : target.target_type === 'long-term' ? 'Long-Term' : 'Net-Zero'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{target.baseline_year} → {target.target_year}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              <span>
                {target.reduction_percentage
                  ? target.reduction_percentage.toFixed(1)
                  : ((target.baseline_emissions - target.target_emissions) / target.baseline_emissions * 100).toFixed(1)
                }% reduction target
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>Scopes: {target.scope_coverage?.map(s => s.replace('scope_', '')).join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg}`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600 dark:text-gray-400">Progress to Target</span>
          <span className="font-semibold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              progress >= 100 ? 'bg-green-500' :
              progress >= 75 ? 'bg-blue-500' :
              progress >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
          />
        </div>

        {/* Gap indicator - Simplified */}
        {!isCalculated && target.current_emissions && target.current_emissions > 0 && (() => {
          const currentYear = new Date().getFullYear();
          const yearsElapsed = currentYear - target.baseline_year;
          const totalYears = target.target_year - target.baseline_year;

          // Where we should be by now (linear reduction path)
          const expectedReduction = (target.baseline_emissions - target.target_emissions) * (yearsElapsed / totalYears);
          const expectedEmissions = target.baseline_emissions - expectedReduction;
          const gap = target.current_emissions - expectedEmissions;
          const status = target.performance_status || 'pending';

          if (status === 'exceeding' || status === 'on-track') {
            return null; // Don't show anything when on track
          }

          return (
            <div className="mt-2 text-xs">
              <div className={`flex items-center gap-2 ${
                status === 'at-risk'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {Math.abs(gap).toFixed(1)} tCO2e behind target
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Metrics Grid - Compact Version */}
      <div className="grid grid-cols-4 gap-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Baseline ({target.baseline_year})</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {target.baseline_emissions.toFixed(1)}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">tCO2e</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current ({new Date().getFullYear()})</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {target.current_emissions ? target.current_emissions.toFixed(1) : '-'}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">tCO2e</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Target ({target.target_year})</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {target.target_emissions.toFixed(1)}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">tCO2e</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Annual Rate</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {target.annual_reduction_rate
              ? `${target.annual_reduction_rate.toFixed(1)}%`
              : `${(((target.baseline_emissions - target.target_emissions) / target.baseline_emissions * 100) / (target.target_year - target.baseline_year)).toFixed(1)}%`
            }
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">per year</span>
          </div>
        </div>
      </div>

      {/* Actions - Compact */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {isCalculated ? (
          <>
            <button
              onClick={handleCommitTarget}
              disabled={committing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {committing ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Committing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Commit Target
                </>
              )}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Edit className="w-3.5 h-3.5" />
              Customize
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setReplanningTarget(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replan
            </button>
            <button
              onClick={() => setActionPlanTarget(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Action Plan
            </button>
            <button
              onClick={() => setTrajectoryTarget(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LineChart className="w-3.5 h-3.5" />
              Trajectory
            </button>
            <button
              onClick={() => setEditTarget(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => setRollbackTarget(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Create Target Modal (placeholder - will build this next)
function CreateTargetModal({
  organizationId,
  onClose,
  onSuccess
}: {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Target</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set up a new science-based emissions reduction target
          </p>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Target creation wizard coming soon...
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Create Target
          </button>
        </div>
      </div>
    </div>
  );
}
