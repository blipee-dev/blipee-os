'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface Initiative {
  id: string;
  initiative_name: string;
  initiative_description?: string;
  initiative_category?: string;
  estimated_reduction?: number;
  actual_reduction?: number;
  cost_estimate?: number;
  actual_cost?: number;
  roi?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  completion_percentage: number;
  priority: number;
}

interface InitiativeTrackerProps {
  targetId?: string | null;
  onRefresh?: () => void;
}

export function InitiativeTracker({ targetId, onRefresh }: InitiativeTrackerProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);

  useEffect(() => {
    if (targetId) {
      fetchInitiatives();
    }
  }, [targetId]);

  const fetchInitiatives = async () => {
    try {
      // TODO: Fetch from target_initiatives table once populated
      // const response = await fetch(`/api/sustainability/initiatives?targetId=${targetId}`);
      // const data = await response.json();
      // setInitiatives(data.initiatives || []);

      // For now, no initiatives until table is populated
      setInitiatives([]);
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'in-progress': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'planned': return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
      case 'cancelled': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'planned': return <Calendar className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalReduction = initiatives.reduce((sum, i) => sum + (i.estimated_reduction || 0), 0);
  const totalCost = initiatives.reduce((sum, i) => sum + (i.cost_estimate || 0), 0);

  if (!targetId) {
    return (
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Initiative Tracker
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Select a target to view its initiatives
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Initiative Tracker
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Initiative
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Impact</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {totalReduction.toFixed(0)} tCO2e
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Investment</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ${(totalCost / 1000).toFixed(0)}k
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Cost per tCO2e</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ${totalReduction > 0 ? (totalCost / totalReduction).toFixed(0) : 0}
          </p>
        </div>
      </div>

      {/* Initiative List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : initiatives.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No initiatives yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add initiatives to track progress toward this target
            </p>
          </div>
        ) : (
          initiatives.map((initiative, index) => (
            <motion.div
              key={initiative.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 dark:border-white/[0.05] rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {initiative.initiative_name}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusColor(initiative.status)}`}>
                      {getStatusIcon(initiative.status)}
                      {initiative.status}
                    </span>
                  </div>

                  {initiative.initiative_description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {initiative.initiative_description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {initiative.estimated_reduction} tCO2e
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${(initiative.cost_estimate || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(initiative.start_date || '').toLocaleDateString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs text-gray-500">{initiative.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${initiative.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingInitiative(initiative)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Timeline View */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Timeline
        </h4>
        <div className="relative">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
          {initiatives.map((initiative, index) => (
            <div key={initiative.id} className="relative flex items-center mb-4">
              <div className={`absolute left-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#212121] ${
                initiative.status === 'completed' ? 'bg-green-500' :
                initiative.status === 'in-progress' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}></div>
              <div className="ml-8">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {initiative.initiative_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(initiative.start_date || '').toLocaleDateString()} -
                  {initiative.end_date ? new Date(initiative.end_date).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}