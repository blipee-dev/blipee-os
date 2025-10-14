'use client';

import { useState } from 'react';
import { EducationalModal } from '@/components/education/EducationalModal';
import { BookOpen, Target, Flame, Lightbulb, BarChart3 } from 'lucide-react';

export default function EducationPreviewPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const topics = [
    {
      id: 'carbon-basics',
      title: 'Carbon Basics',
      description: 'What is CO2e and how to understand emissions',
      icon: '🌍',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'scopes-explained',
      title: 'GHG Protocol Scopes',
      description: 'Understanding Scope 1, 2, and 3 emissions',
      icon: '📊',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'why-it-matters',
      title: 'Why Climate Action Matters',
      description: 'The 1.5°C target and impacts on Portugal',
      icon: '🔥',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'reduction-strategies',
      title: 'How to Reduce Emissions',
      description: 'High-impact actions and quick wins',
      icon: '💡',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      id: 'sbti-targets',
      title: 'Science-Based Targets',
      description: 'What are SBTi targets and why they matter',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Educational Modals Preview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Click any card below to preview the educational content
          </p>
        </div>

        {/* Topic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveModal(topic.id)}
              className="group relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

              <div className="relative p-6">
                {/* Icon */}
                <div className="text-5xl mb-4">{topic.icon}</div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-left">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                  {topic.description}
                </p>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                How to use in your dashboard
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                These educational modals will appear when users click "Learn more" links in tooltips,
                or access them via the floating help button. They provide context without disrupting
                the existing compliance dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Multi-section</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Navigate through multiple sections with progress indicators
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Visual Comparisons</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-world examples and tangible comparisons
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Portuguese Context</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Localized examples relevant to Portugal
            </p>
          </div>
        </div>
      </div>

      {/* Educational Modal */}
      <EducationalModal activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
