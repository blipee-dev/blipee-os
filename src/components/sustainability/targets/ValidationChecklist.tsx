'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  BarChart3,
  Users,
  Target,
  Shield,
  Clock,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  description: string;
  status: 'complete' | 'incomplete' | 'in-progress' | 'not-applicable';
  required: boolean;
  progress?: number;
}

interface ValidationChecklistProps {
  targetId: string;
}

export function ValidationChecklist({ targetId }: ValidationChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ghg-inventory');

  useEffect(() => {
    fetchChecklist();
  }, [targetId]);

  const fetchChecklist = async () => {
    try {
      // Mock data for now
      setChecklist([
        // GHG Inventory
        {
          id: '1',
          category: 'ghg-inventory',
          requirement: 'Complete GHG Inventory',
          description: 'At least 3 consecutive years of complete emissions data',
          status: 'complete',
          required: true,
          progress: 100
        },
        {
          id: '2',
          category: 'ghg-inventory',
          requirement: 'Scope 1 & 2 Coverage',
          description: 'Minimum 95% of Scope 1 & 2 emissions must be covered',
          status: 'complete',
          required: true,
          progress: 98
        },
        {
          id: '3',
          category: 'ghg-inventory',
          requirement: 'Scope 3 Screening',
          description: 'Complete screening of all 15 Scope 3 categories',
          status: 'in-progress',
          required: true,
          progress: 67
        },
        {
          id: '4',
          category: 'ghg-inventory',
          requirement: 'Scope 3 Coverage',
          description: 'If >40% of total, must set Scope 3 target covering ≥67%',
          status: 'incomplete',
          required: true,
          progress: 45
        },

        // Target Ambition
        {
          id: '5',
          category: 'target-ambition',
          requirement: '1.5°C Alignment',
          description: 'Minimum 4.2% annual reduction for 1.5°C pathway',
          status: 'complete',
          required: true,
          progress: 100
        },
        {
          id: '6',
          category: 'target-ambition',
          requirement: 'Near-term Target',
          description: '5-10 year target from baseline year',
          status: 'complete',
          required: true,
          progress: 100
        },
        {
          id: '7',
          category: 'target-ambition',
          requirement: 'Net-Zero Commitment',
          description: 'Long-term net-zero target by 2050',
          status: 'in-progress',
          required: false,
          progress: 0
        },

        // Organizational Commitment
        {
          id: '8',
          category: 'organizational',
          requirement: 'Board Approval',
          description: 'Formal board approval of targets',
          status: 'incomplete',
          required: true,
          progress: 0
        },
        {
          id: '9',
          category: 'organizational',
          requirement: 'Public Commitment',
          description: 'Public commitment letter to SBTi',
          status: 'incomplete',
          required: true,
          progress: 0
        },
        {
          id: '10',
          category: 'organizational',
          requirement: 'Resources Allocated',
          description: 'Dedicated budget and team for implementation',
          status: 'in-progress',
          required: true,
          progress: 50
        },

        // Documentation
        {
          id: '11',
          category: 'documentation',
          requirement: 'Target Submission Form',
          description: 'Complete SBTi target submission form',
          status: 'incomplete',
          required: true,
          progress: 25
        },
        {
          id: '12',
          category: 'documentation',
          requirement: 'GHG Inventory Report',
          description: 'Detailed emissions inventory with methodology',
          status: 'in-progress',
          required: true,
          progress: 75
        },
        {
          id: '13',
          category: 'documentation',
          requirement: 'Implementation Plan',
          description: 'Roadmap for achieving targets',
          status: 'in-progress',
          required: false,
          progress: 60
        }
      ]);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: 'ghg-inventory',
      name: 'GHG Inventory',
      icon: <BarChart3 className="w-5 h-5" />,
      items: checklist.filter(i => i.category === 'ghg-inventory')
    },
    {
      id: 'target-ambition',
      name: 'Target Ambition',
      icon: <Target className="w-5 h-5" />,
      items: checklist.filter(i => i.category === 'target-ambition')
    },
    {
      id: 'organizational',
      name: 'Organizational',
      icon: <Building2 className="w-5 h-5" />,
      items: checklist.filter(i => i.category === 'organizational')
    },
    {
      id: 'documentation',
      name: 'Documentation',
      icon: <FileText className="w-5 h-5" />,
      items: checklist.filter(i => i.category === 'documentation')
    }
  ];

  const overallProgress = checklist.length > 0
    ? checklist.reduce((sum, item) => sum + (item.progress || 0), 0) / checklist.length
    : 0;

  const requiredComplete = checklist
    .filter(i => i.required)
    .filter(i => i.status === 'complete').length;

  const requiredTotal = checklist.filter(i => i.required).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'incomplete':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'incomplete':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          SBTi Validation Checklist
        </h3>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-500">
            {requiredComplete}/{requiredTotal} Required
          </span>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Overall Readiness
          </span>
          <span className="text-sm text-gray-500">
            {overallProgress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              overallProgress >= 80
                ? 'bg-green-500'
                : overallProgress >= 50
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {overallProgress >= 80
            ? 'Ready for submission to SBTi'
            : overallProgress >= 50
            ? 'Good progress, some requirements pending'
            : 'Significant work needed before submission'}
        </p>
      </div>

      {/* Category Sections */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryProgress = category.items.length > 0
            ? category.items.reduce((sum, item) => sum + (item.progress || 0), 0) / category.items.length
            : 0;

          const isExpanded = expandedCategory === category.id;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-white/[0.05] rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-500">{category.icon}</div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.items.filter(i => i.status === 'complete').length}/{category.items.length} complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        categoryProgress >= 80
                          ? 'bg-green-500'
                          : categoryProgress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-gray-200 dark:border-white/[0.05]"
                >
                  <div className="p-4 space-y-3">
                    {category.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg"
                      >
                        <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">
                                {item.requirement}
                                {item.required && (
                                  <span className="ml-2 text-xs text-red-500">*Required</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>
                          {item.progress !== undefined && item.status !== 'complete' && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Progress</span>
                                <span className="text-xs text-gray-500">{item.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Submission Readiness Alert */}
      {overallProgress >= 80 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Ready for SBTi Submission
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                All required criteria have been met. You can now submit your targets to the Science Based Targets initiative for validation.
              </p>
              <button className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">
                Begin Submission Process
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Not Yet Ready for Submission
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Complete all required items before submitting to SBTi. Focus on items marked as "Required" first.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              About SBTi Validation
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              The validation process typically takes 30-60 days after submission. Ensure all documentation is complete and accurate to avoid delays.
            </p>
            <a href="#" className="text-xs text-blue-600 dark:text-blue-400 underline mt-1 inline-block">
              View SBTi Criteria Guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}