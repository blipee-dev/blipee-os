'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ThumbsUp, ThumbsDown } from 'lucide-react';

interface PredictionPillsProps {
  context: any;
  onAction: (action: string, params?: any) => void;
}

export const PredictionPills: React.FC<PredictionPillsProps> = ({
  context,
  onAction,
}) => {
  const [predictions, setPredictions] = useState<Array<{
    id: string;
    text: string;
    icon: string;
    confidence: number;
    action: string;
    priority: number;
  }>>([]);

  useEffect(() => {
    // AI predictions based on context
    const generatePredictions = () => {
      const basePredictions = [];

      // Time-based predictions
      const hour = new Date().getHours();
      const day = new Date().getDay();

      if (hour >= 8 && hour <= 10) {
        basePredictions.push({
          id: 'morning-check',
          text: 'View overnight emissions',
          icon: '',
          confidence: 0.9,
          action: 'emissions/overnight',
          priority: 1,
        });
        basePredictions.push({
          id: 'morning-alerts',
          text: 'Check new alerts',
          icon: '',
          confidence: 0.85,
          action: 'alerts/new',
          priority: 2,
        });
      }

      if (hour >= 11 && hour <= 14) {
        basePredictions.push({
          id: 'peak-usage-midday',
          text: 'Monitor peak energy',
          icon: '',
          confidence: 0.88,
          action: 'energy/peak',
          priority: 1,
        });
        basePredictions.push({
          id: 'optimize-peak-hours',
          text: 'Optimize for peak hours',
          icon: '',
          confidence: 0.82,
          action: 'optimize/peak',
          priority: 2,
        });
      }

      if (hour >= 16 && hour <= 18) {
        basePredictions.push({
          id: 'daily-summary',
          text: "Review today's performance",
          icon: '',
          confidence: 0.92,
          action: 'summary/daily',
          priority: 1,
        });
        basePredictions.push({
          id: 'tomorrow-prep',
          text: 'Prepare tomorrow schedule',
          icon: '',
          confidence: 0.78,
          action: 'schedule/tomorrow',
          priority: 3,
        });
      }

      // Day-based predictions
      if (day === 1) {
        // Monday
        basePredictions.push({
          id: 'weekly-goals',
          text: 'Set weekly targets',
          icon: '',
          confidence: 0.87,
          action: 'goals/weekly',
          priority: 2,
        });
      }

      if (day === 5) {
        // Friday
        basePredictions.push({
          id: 'weekly-report',
          text: 'Generate weekly report',
          icon: '',
          confidence: 0.91,
          action: 'reports/weekly',
          priority: 1,
        });
      }

      // Context-based predictions from recent actions
      if (context?.recentActions && context.recentActions.length > 0) {
        const lastAction = context.recentActions[context.recentActions.length - 1];
        if (lastAction?.action?.includes('emissions')) {
          basePredictions.push({
            id: 'emissions-breakdown',
            text: 'View emission sources',
            icon: '',
            confidence: 0.85,
            action: 'emissions/sources',
            priority: 2,
          });
          basePredictions.push({
            id: 'emissions-reduce',
            text: 'Find reduction opportunities',
            icon: '',
            confidence: 0.80,
            action: 'emissions/reduce',
            priority: 3,
          });
        }
      }

      // Always available predictions with unique timestamps to avoid duplicate keys
      const timestamp = Date.now();
      basePredictions.push({
        id: `anomalies-${timestamp}`,
        text: 'Detect anomalies',
        icon: '',
        confidence: 0.75,
        action: 'analyze/anomalies',
        priority: 4,
      });

      basePredictions.push({
        id: `quick-wins-${timestamp}`,
        text: 'Find quick wins',
        icon: '',
        confidence: 0.72,
        action: 'optimize/quick',
        priority: 5,
      });

      basePredictions.push({
        id: `compare-${timestamp}`,
        text: 'Compare to yesterday',
        icon: '',
        confidence: 0.70,
        action: 'compare/yesterday',
        priority: 6,
      });

      // Sort by priority and confidence, take top 8
      return basePredictions
        .sort((a, b) => {
          const scoreA = a.priority * 0.3 + a.confidence * 0.7;
          const scoreB = b.priority * 0.3 + b.confidence * 0.7;
          return scoreB - scoreA;
        })
        .slice(0, 8);
    };

    setPredictions(generatePredictions());

    // Update predictions every minute
    const interval = setInterval(() => {
      setPredictions(generatePredictions());
    }, 60000);

    return () => clearInterval(interval);
  }, [context]);

  const handlePillClick = (prediction: any) => {
    onAction(prediction.action);

    // Remove clicked prediction temporarily
    setPredictions(prev => prev.filter(p => p.id !== prediction.id));

    // Add it back after 30 seconds with lower confidence and new unique ID
    setTimeout(() => {
      setPredictions(prev => [...prev, {
        ...prediction,
        id: `${prediction.id}-${Date.now()}`,
        confidence: prediction.confidence * 0.8
      }]);
    }, 30000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-white/60 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI Suggestions
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Learning from your patterns</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {predictions.map((prediction, index) => (
            <motion.button
              key={prediction.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePillClick(prediction)}
              className="group relative px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-white/[0.1] rounded-full hover:border-purple-300 dark:hover:border-white/[0.2] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-white/90">{prediction.text}</span>
                {prediction.confidence > 0.85 && (
                  <span className="text-xs text-green-400">
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Click to execute • Confidence: {Math.round(prediction.confidence * 100)}%
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Learning feedback */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-gray-500 dark:text-white/40">Was this helpful?</span>
        <button
          onClick={() =>}
          className="p-1 hover:bg-green-500/20 rounded transition-all text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() =>}
          className="p-1 hover:bg-red-500/20 rounded transition-all text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};