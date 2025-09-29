'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Building2,
  CheckCircle,
  Download,
  Zap,
  Target,
  AlertTriangle,
  DollarSign,
  Search,
  TrendingDown,
  Globe
} from 'lucide-react';

interface QueryCardGridProps {
  onAction: (action: string, params?: any) => void;
  context?: any;
}

export const QueryCardGrid: React.FC<QueryCardGridProps> = ({
  onAction,
  context,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedVerb, setSelectedVerb] = useState<string>('');
  const [selectedModifier, setSelectedModifier] = useState<string>('');

  // Pre-built query templates
  const queryTemplates = [
    { icon: <BarChart3 className="w-5 h-5" />, text: 'Show current emissions', action: 'query/emissions/current' },
    { icon: <TrendingUp className="w-5 h-5" />, text: 'Compare to last month', action: 'query/compare/month' },
    { icon: <Building2 className="w-5 h-5" />, text: 'View by building', action: 'query/view/building' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Check compliance status', action: 'query/compliance/status' },
    { icon: <Download className="w-5 h-5" />, text: 'Export monthly report', action: 'query/export/monthly' },
    { icon: <Zap className="w-5 h-5" />, text: 'Optimize energy usage', action: 'query/optimize/energy' },
    { icon: <Target className="w-5 h-5" />, text: 'Track goal progress', action: 'query/goals/progress' },
    { icon: <AlertTriangle className="w-5 h-5" />, text: 'Show active alerts', action: 'query/alerts/active' },
    { icon: <DollarSign className="w-5 h-5" />, text: 'Calculate cost savings', action: 'query/savings/calculate' },
    { icon: <Search className="w-5 h-5" />, text: 'Find inefficiencies', action: 'query/find/inefficiencies' },
    { icon: <TrendingDown className="w-5 h-5" />, text: 'Identify reduction opportunities', action: 'query/reduction/opportunities' },
    { icon: <Globe className="w-5 h-5" />, text: 'Carbon footprint breakdown', action: 'query/carbon/breakdown' },
  ];

  // Common questions organized by category
  const questionCategories = {
    'What': [
      'What is our current carbon footprint?',
      'What are the main emission sources?',
      'What changed since yesterday?',
      'What are our reduction targets?',
      'What buildings use most energy?',
      'What are the compliance requirements?',
    ],
    'How': [
      'How much did we save this month?',
      'How are we tracking against goals?',
      'How can we reduce emissions?',
      'How does this compare to industry?',
      'How efficient are our buildings?',
      'How to optimize energy usage?',
    ],
    'Why': [
      'Why did emissions spike yesterday?',
      'Why is Building A using more energy?',
      'Why are costs increasing?',
      'Why did water usage change?',
      'Why are we off target?',
      'Why is efficiency dropping?',
    ],
    'When': [
      'When do we reach net zero?',
      'When is the next report due?',
      'When was the last audit?',
      'When do we need to act?',
      'When are peak usage times?',
      'When should we optimize?',
    ],
  };

  // Visual sentence builder
  const sentenceBuilder = {
    subjects: [
      { label: 'Emissions', value: 'emissions' },
      { label: 'Energy', value: 'energy' },
      { label: 'Water', value: 'water' },
      { label: 'Waste', value: 'waste' },
      { label: 'Costs', value: 'costs' },
      { label: 'Buildings', value: 'buildings' },
      { label: 'Compliance', value: 'compliance' },
      { label: 'Goals', value: 'goals' },
    ],
    verbs: [
      { label: 'Show', value: 'show' },
      { label: 'Compare', value: 'compare' },
      { label: 'Analyze', value: 'analyze' },
      { label: 'Optimize', value: 'optimize' },
      { label: 'Track', value: 'track' },
      { label: 'Find', value: 'find' },
      { label: 'Calculate', value: 'calculate' },
      { label: 'Predict', value: 'predict' },
    ],
    modifiers: [
      { label: 'Today', value: 'today' },
      { label: 'This week', value: 'week' },
      { label: 'This month', value: 'month' },
      { label: 'vs last month', value: 'vs_month' },
      { label: 'vs target', value: 'vs_target' },
      { label: 'by building', value: 'by_building' },
      { label: 'by source', value: 'by_source' },
      { label: 'trends', value: 'trends' },
    ],
  };

  const executeQuery = () => {
    if (selectedSubject && selectedVerb) {
      const query = `${selectedVerb}/${selectedSubject}${selectedModifier ? `/${selectedModifier}` : ''}`;
      onAction(query);
      // Reset selection
      setSelectedSubject('');
      setSelectedVerb('');
      setSelectedModifier('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Visual Query Builder
      </h2>

      {/* Quick Query Templates */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🚀 Quick Queries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {queryTemplates.map((template, index) => (
            <motion.button
              key={template.action}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onAction(template.action)}
              className="p-3 bg-gray-50 dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white rounded-lg transition-all text-left flex items-center gap-3 border border-gray-200 dark:border-white/[0.05]"
            >
              <span className="text-gray-600 dark:text-white/60">{template.icon}</span>
              <span className="text-sm text-gray-700 dark:text-white/80">{template.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Visual Sentence Builder */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔨 Build Your Query
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subject Selection */}
          <div>
            <h4 className="text-sm text-gray-600 dark:text-white/60 mb-3">What to View</h4>
            <div className="space-y-2">
              {sentenceBuilder.subjects.map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => setSelectedSubject(subject.value)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedSubject === subject.value
                      ? 'bg-blue-500/30 border-blue-400 text-blue-900 dark:text-white'
                      : 'bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'
                  } border`}
                >
                  {subject.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verb Selection */}
          <div>
            <h4 className="text-sm text-gray-600 dark:text-white/60 mb-3">Action</h4>
            <div className="space-y-2">
              {sentenceBuilder.verbs.map((verb) => (
                <button
                  key={verb.value}
                  onClick={() => setSelectedVerb(verb.value)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedVerb === verb.value
                      ? 'bg-green-500/30 border-green-400 text-green-900 dark:text-white'
                      : 'bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'
                  } border`}
                >
                  {verb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modifier Selection */}
          <div>
            <h4 className="text-sm text-gray-600 dark:text-white/60 mb-3">Filter/Modifier (Optional)</h4>
            <div className="space-y-2">
              {sentenceBuilder.modifiers.map((modifier) => (
                <button
                  key={modifier.value}
                  onClick={() => setSelectedModifier(modifier.value)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedModifier === modifier.value
                      ? 'bg-purple-500/30 border-purple-400 text-purple-900 dark:text-white'
                      : 'bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'
                  } border`}
                >
                  {modifier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execute Button */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-gray-600 dark:text-white/60">
            {selectedVerb && selectedSubject && (
              <span className="text-gray-900 dark:text-white">
                {selectedVerb} {selectedSubject}
                {selectedModifier && ` ${selectedModifier}`}
              </span>
            )}
          </div>
          <button
            onClick={executeQuery}
            disabled={!selectedSubject || !selectedVerb}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedSubject && selectedVerb
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90'
                : 'bg-gray-200 dark:bg-white/[0.05] text-gray-400 dark:text-white/40 cursor-not-allowed'
            }`}
          >
            Execute Query
          </button>
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ❓ Common Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(questionCategories).map(([category, questions]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-600 dark:text-white/60 mb-3">{category}</h4>
              <div className="space-y-2">
                {questions.map((question) => (
                  <button
                    key={question}
                    onClick={() => onAction(`question/${question.toLowerCase().replace(/\s+/g, '_')}`)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all text-left border border-gray-200 dark:border-transparent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};