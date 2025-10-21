'use client';

import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

interface FloatingHelpButtonProps {
  onTopicSelect: (topicId: string) => void;
}

const educationalTopics = [
  {
    id: 'carbon-basics',
    icon: '🌍',
    titleKey: 'education.topics.carbonBasics.title'
  },
  {
    id: 'scopes-explained',
    icon: '📊',
    titleKey: 'education.topics.scopesExplained.title'
  },
  {
    id: 'why-it-matters',
    icon: '🔥',
    titleKey: 'education.topics.whyItMatters.title'
  },
  {
    id: 'reduction-strategies',
    icon: '💡',
    titleKey: 'education.topics.reductionStrategies.title'
  },
  {
    id: 'sbti-targets',
    icon: '🎯',
    titleKey: 'education.topics.sbtiTargets.title'
  }
];

export function FloatingHelpButton({ onTopicSelect }: FloatingHelpButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  const handleTopicClick = (topicId: string) => {
    onTopicSelect(topicId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating Button with Pulse Animation */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Pulse rings */}
        {!isMenuOpen && (
          <>
            <div className="absolute inset-0 w-14 h-14 bg-blue-500 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-0 w-14 h-14 bg-purple-500 rounded-full animate-pulse opacity-20" />
          </>
        )}

        {/* Main Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label={t('education.modal.learnMore')}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Helpful Tooltip (shows on first visit) */}
        {!isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap animate-bounce">
            Need help? Click here!
            <div className="absolute top-full right-6 -mt-1 w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        )}
      </div>

      {/* Topics Menu */}
      {isMenuOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-80 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('education.modal.learnMore')}
            </h3>
          </div>

          {/* Topics List */}
          <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {educationalTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {topic.icon}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(topic.titleKey)}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#212121]">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Click any topic to learn more
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
