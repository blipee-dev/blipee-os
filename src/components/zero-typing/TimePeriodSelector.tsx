'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/providers/LanguageProvider';

export interface TimePeriod {
  id: string;
  label: string;
  start: string;
  end: string;
  type: 'days' | 'month' | 'quarter' | 'year';
}

interface TimePeriodSelectorProps {
  currentPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  currentPeriod,
  onPeriodChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('common.filters.timePeriodSelector');

  // Generate time period options
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => new Date().getMonth();
  const getCurrentQuarter = () => Math.floor(getCurrentMonth() / 3);

  const timePeriods: TimePeriod[] = [
    // Current year
    {
      id: 'current-year',
      label: `${getCurrentYear()}`,
      start: `${getCurrentYear()}-01-01`,
      end: `${getCurrentYear()}-12-31`,
      type: 'year'
    },
    // Previous year
    {
      id: 'previous-year',
      label: `${getCurrentYear() - 1}`,
      start: `${getCurrentYear() - 1}-01-01`,
      end: `${getCurrentYear() - 1}-12-31`,
      type: 'year'
    },
    // 2023
    {
      id: 'year-2023',
      label: '2023',
      start: '2023-01-01',
      end: '2023-12-31',
      type: 'year'
    },
    // 2022
    {
      id: 'year-2022',
      label: '2022',
      start: '2022-01-01',
      end: '2022-12-31',
      type: 'year'
    },
    // Last 30 days
    {
      id: 'last-30-days',
      label: t('last30Days'),
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      type: 'days'
    },
    // Last 90 days
    {
      id: 'last-90-days',
      label: t('last90Days'),
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      type: 'days'
    },
    // Current quarter
    {
      id: 'current-quarter',
      label: t('currentQuarter', { quarter: getCurrentQuarter() + 1, year: getCurrentYear() }),
      start: `${getCurrentYear()}-${String((getCurrentQuarter() * 3) + 1).padStart(2, '0')}-01`,
      end: `${getCurrentYear()}-${String(((getCurrentQuarter() + 1) * 3)).padStart(2, '0')}-31`,
      type: 'quarter'
    }
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
      >
        <Calendar className="w-4 h-4 text-gray-500 dark:text-white/70" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentPeriod.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-white/70 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl shadow-lg z-20"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-white/50 px-3 py-2 mb-1">
                  {t('timePeriod')}
                </div>

                {timePeriods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => {
                      onPeriodChange(period);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                      currentPeriod.id === period.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{period.label}</div>
                      <div className="text-xs text-gray-500 dark:text-white/50">
                        {period.type === 'days' ? `${period.label}` :
                         period.type === 'year' ? t('yearRange', { year: period.label }) :
                         period.type === 'quarter' ? t('quarterLabel', { quarter: getCurrentQuarter() + 1 }) :
                         t('fullMonth')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};