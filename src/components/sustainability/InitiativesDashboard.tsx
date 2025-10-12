'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Zap,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  Target,
  BarChart3,
  X
} from 'lucide-react';

interface Initiative {
  id: string;
  organization_id: string;
  metric_target_id?: string;
  sustainability_target_id?: string;
  name: string;
  description?: string;
  initiative_type: string;
  estimated_reduction_tco2e: number;
  estimated_reduction_percentage?: number;
  actual_reduction_tco2e?: number;
  start_date: string;
  completion_date?: string;
  implementation_status: string;
  capex?: number;
  annual_opex?: number;
  annual_savings?: number;
  roi_years?: number;
  confidence_score: number;
  risk_level: string;
  risks?: string;
  dependencies?: string;
  created_at: string;
  updated_at: string;
}

interface InitiativesDashboardProps {
  organizationId: string;
  targetId?: string;
  targetName?: string;
}

export default function InitiativesDashboard({
  organizationId,
  targetId,
  targetName
}: InitiativesDashboardProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchInitiatives();
  }, [organizationId, targetId]);

  const fetchInitiatives = async () => {
    try {
      setLoading(true);
      let url = `/api/sustainability/initiatives?organization_id=${organizationId}`;
      if (targetId) {
        url += `&target_id=${targetId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setInitiatives(data.initiatives || []);
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter initiatives
  const filteredInitiatives = initiatives.filter(initiative => {
    const matchesSearch = initiative.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         initiative.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || initiative.implementation_status === statusFilter;
    const matchesType = typeFilter === 'all' || initiative.initiative_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary stats
  const totalReduction = filteredInitiatives.reduce((sum, i) => sum + (i.actual_reduction_tco2e || i.estimated_reduction_tco2e), 0);
  const totalInvestment = filteredInitiatives.reduce((sum, i) => sum + (i.capex || 0) + (i.annual_opex || 0), 0);
  const totalSavings = filteredInitiatives.reduce((sum, i) => sum + (i.annual_savings || 0), 0);
  const completedCount = filteredInitiatives.filter(i => i.implementation_status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
          <p className="text-gray-400">Loading initiatives...</p>
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
              <Zap className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reduction Initiatives
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {targetName ? `Initiatives for ${targetName}` : 'Manage your emissions reduction initiatives'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Initiative
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 dark:text-green-300">Total Reduction</span>
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {totalReduction.toFixed(1)} tCO2e
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">Investment</span>
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${(totalInvestment / 1000).toFixed(0)}k
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700 dark:text-purple-300">Annual Savings</span>
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ${(totalSavings / 1000).toFixed(0)}k/yr
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-yellow-700 dark:text-yellow-300">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {completedCount} / {filteredInitiatives.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search initiatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="delayed">Delayed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="energy_efficiency">Energy Efficiency</option>
              <option value="renewable_energy">Renewable Energy</option>
              <option value="fuel_switch">Fuel Switch</option>
              <option value="fleet_electrification">Fleet Electrification</option>
              <option value="behavioral_change">Behavioral Change</option>
              <option value="procurement_policy">Procurement Policy</option>
              <option value="supplier_engagement">Supplier Engagement</option>
              <option value="process_optimization">Process Optimization</option>
              <option value="carbon_offset">Carbon Offset</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Initiatives List */}
      {filteredInitiatives.length === 0 ? (
        <EmptyState onCreateInitiative={() => setShowCreateModal(true)} />
      ) : (
        <div className="space-y-4">
          {filteredInitiatives.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              onRefresh={fetchInitiatives}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInitiativeModal
          organizationId={organizationId}
          targetId={targetId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInitiatives();
          }}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateInitiative }: { onCreateInitiative: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-12">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <Zap className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No Initiatives Yet
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Start reducing your emissions by creating your first reduction initiative.
          Track progress, costs, and impact all in one place.
        </p>

        <button
          onClick={onCreateInitiative}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Your First Initiative
        </button>
      </div>
    </div>
  );
}

// Initiative Card Component
function InitiativeCard({
  initiative,
  onRefresh
}: {
  initiative: Initiative;
  onRefresh: () => void;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Completed' };
      case 'in_progress':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'In Progress' };
      case 'approved':
        return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Approved' };
      case 'planned':
        return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Planned' };
      case 'on_hold':
        return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'On Hold' };
      case 'delayed':
        return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Delayed' };
      case 'cancelled':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Cancelled' };
      default:
        return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: status };
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const statusConfig = getStatusConfig(initiative.implementation_status);
  const timelineMonths = initiative.completion_date
    ? Math.round((new Date(initiative.completion_date).getTime() - new Date(initiative.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{initiative.name}</h3>
            <span className={`px-2.5 py-1 ${statusConfig.bg} ${statusConfig.color} text-xs font-semibold rounded-full`}>
              {statusConfig.label}
            </span>
            <span className={`px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-xs font-semibold rounded-full`}>
              {initiative.initiative_type.replace(/_/g, ' ')}
            </span>
          </div>
          {initiative.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {initiative.description}
            </p>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Impact</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {initiative.estimated_reduction_tco2e.toFixed(1)} tCO2e
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {(initiative.confidence_score * 100).toFixed(0)}% confidence
          </div>
        </div>

        {initiative.capex !== null && initiative.capex !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Investment</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${((initiative.capex || 0) / 1000).toFixed(0)}k
            </div>
            {initiative.annual_opex && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +${(initiative.annual_opex / 1000).toFixed(0)}k/yr opex
              </div>
            )}
          </div>
        )}

        {initiative.annual_savings !== null && initiative.annual_savings !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Savings</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${(initiative.annual_savings / 1000).toFixed(0)}k/yr
            </div>
            {initiative.roi_years && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {initiative.roi_years} year ROI
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Timeline</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {timelineMonths ? `${timelineMonths} mo` : 'TBD'}
          </div>
          <div className={`text-xs ${getRiskColor(initiative.risk_level)}`}>
            {initiative.risk_level} risk
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        {initiative.implementation_status === 'planned' && (
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors ml-auto">
            <CheckCircle2 className="w-4 h-4" />
            Mark as Approved
          </button>
        )}
        {initiative.implementation_status === 'approved' && (
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ml-auto">
            <Clock className="w-4 h-4" />
            Start Implementation
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Create Initiative Modal (placeholder)
function CreateInitiativeModal({
  organizationId,
  targetId,
  onClose,
  onSuccess
}: {
  organizationId: string;
  targetId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Initiative</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Initiative creation form coming soon...
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
            Create Initiative
          </button>
        </div>
      </motion.div>
    </div>
  );
}
