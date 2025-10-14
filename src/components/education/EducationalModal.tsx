'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { getEducationalTopics, type OrganizationContext, type VisualComparison } from '@/lib/education/educational-content';

interface EducationalModalProps {
  activeModal: string | null;
  onClose: () => void;
  organizationContext?: OrganizationContext;
}

export function EducationalModal({ activeModal, onClose, organizationContext }: EducationalModalProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { t } = useLanguage();

  // Generate dynamic educational content based on context and language
  const topics = useMemo(() => {
    return getEducationalTopics(t, organizationContext);
  }, [t, organizationContext]);

  // Reset section index when modal changes
  useEffect(() => {
    setCurrentSectionIndex(0);
  }, [activeModal]);

  if (!activeModal) return null;

  const content = topics.find((topic) => topic.id === activeModal);
  if (!content) return null;

  const currentSection = content.sections[currentSectionIndex];
  const hasMultipleSections = content.sections.length > 1;

  const handleNext = () => {
    if (currentSectionIndex < content.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleClose = () => {
    setCurrentSectionIndex(0); // Reset to first section
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {content.icon && (
              <div className="text-3xl">{content.icon}</div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t(content.titleKey)}
              </h2>
              {hasMultipleSections && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('education.modal.sectionOf', {
                    current: currentSectionIndex + 1,
                    total: content.sections.length
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentSection.heading}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentSection.content}
              </p>
            </div>
          </div>

          {/* Visual Section */}
          {currentSection.visual === 'comparison' && currentSection.visualData && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-4 mt-4 space-y-3">
              {currentSection.visualData.map((item: VisualComparison, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white dark:bg-[#212121] rounded-lg p-3 shadow-sm"
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    {item.value && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {item.value}
                      </p>
                    )}
                    {item.comparison && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {item.comparison}
                      </p>
                    )}
                    {item.impact && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          item.impact === 'HIGH'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : item.impact === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {item.impact} IMPACT
                        </span>
                        {item.savings && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.savings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#212121]">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('education.modal.previous')}
          </button>

          {hasMultipleSections && (
            <div className="flex gap-2">
              {content.sections.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSectionIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSectionIndex
                      ? 'bg-blue-500 w-6'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Go to section ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {currentSectionIndex < content.sections.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              {t('education.modal.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              {t('education.modal.gotIt')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
