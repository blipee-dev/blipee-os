'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Trees,
  Plus,
  Loader2
} from 'lucide-react';

interface OneTouchWorkflowsProps {
  onAction: (action: string, params?: any) => void;
}

export const OneTouchWorkflows: React.FC<OneTouchWorkflowsProps> = ({
  onAction,
}) => {
  const [executing, setExecuting] = useState<string | null>(null);

  const workflows = [
    {
      id: 'daily-report',
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Generate Daily Report',
      description: 'Complete analysis of today\'s performance',
      steps: ['Collect data', 'Analyze trends', 'Generate insights', 'Export PDF'],
      action: 'workflow/daily-report',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      id: 'optimize-all',
      icon: <Zap className="w-8 h-8" />,
      title: 'Optimize Everything',
      description: 'AI-powered optimization across all systems',
      steps: ['Scan systems', 'Identify opportunities', 'Apply changes', 'Monitor'],
      action: 'workflow/optimize-all',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      id: 'compliance-check',
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Compliance Check',
      description: 'Verify all regulatory requirements',
      steps: ['Check standards', 'Validate data', 'Generate report', 'Flag issues'],
      action: 'workflow/compliance-check',
      color: 'from-green-500/20 to-emerald-500/20',
    },
    {
      id: 'emergency-response',
      icon: <AlertTriangle className="w-8 h-8" />,
      title: 'Emergency Response',
      description: 'Immediate action for critical issues',
      steps: ['Assess situation', 'Notify team', 'Apply fixes', 'Document'],
      action: 'workflow/emergency-response',
      color: 'from-red-500/20 to-orange-500/20',
    },
    {
      id: 'weekly-summary',
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Weekly Summary',
      description: 'Comprehensive weekly performance review',
      steps: ['Aggregate data', 'Calculate KPIs', 'Compare goals', 'Share insights'],
      action: 'workflow/weekly-summary',
      color: 'from-indigo-500/20 to-blue-500/20',
    },
    {
      id: 'carbon-offset',
      icon: <Trees className="w-8 h-8" />,
      title: 'Calculate & Offset',
      description: 'Calculate emissions and purchase offsets',
      steps: ['Calculate total', 'Find projects', 'Purchase offsets', 'Get certificate'],
      action: 'workflow/carbon-offset',
      color: 'from-green-500/20 to-teal-500/20',
    },
  ];

  const executeWorkflow = async (workflow: any) => {
    setExecuting(workflow.id);

    // Simulate workflow execution
    setTimeout(() => {
      onAction(workflow.action);
      setExecuting(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        One-Touch Workflows
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-gradient-to-br ${workflow.color} border border-gray-200 dark:border-white/[0.1] rounded-xl p-6 hover:border-gray-300 dark:hover:border-white/[0.2] transition-all group`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${
                  workflow.id === 'emergency-response'
                    ? 'text-red-600 dark:text-red-400'
                    : workflow.id === 'compliance-check'
                    ? 'text-green-600 dark:text-green-400'
                    : workflow.id === 'carbon-offset'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : workflow.id === 'optimize-all'
                    ? 'text-purple-600 dark:text-purple-400'
                    : workflow.id === 'weekly-summary'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {workflow.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {workflow.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                    {workflow.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps preview */}
            <div className="space-y-1 mb-4">
              {workflow.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50"
                >
                  <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px]">
                    {stepIndex + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {/* Execute button */}
            <button
              onClick={() => executeWorkflow(workflow)}
              disabled={executing === workflow.id}
              className="w-full py-3 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-transparent"
            >
              {executing === workflow.id ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </span>
              ) : (
                'Execute Now'
              )}
            </button>

            {/* Success indicator */}
            {executing === workflow.id && (
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-xl"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Custom workflow builder */}
      <div className="bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4">
        <button
          onClick={() => onAction('workflow/builder')}
          className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-gray-700 dark:text-white rounded-lg transition-all flex items-center justify-center gap-2 border border-purple-200 dark:border-transparent"
        >
          <Plus className="w-5 h-5" />
          <span>Create Custom Workflow</span>
        </button>
      </div>
    </div>
  );
};