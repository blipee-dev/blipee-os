"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ZXCVBNResult } from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password: string;
  userInputs?: string[]; // Additional context (email, name, etc.) to check against
  showFeedback?: boolean;
  className?: string;
}

// Dynamically import zxcvbn (it's a large library)
let zxcvbn: typeof import('zxcvbn') | null = null;

export function PasswordStrengthMeter({
  password,
  userInputs = [],
  showFeedback = true,
  className = ''
}: PasswordStrengthMeterProps) {
  const [result, setResult] = useState<ZXCVBNResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically load zxcvbn on first use
    if (!zxcvbn) {
      import('zxcvbn').then((module) => {
        zxcvbn = module.default;
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!password || !zxcvbn || isLoading) {
      setResult(null);
      return;
    }

    // Calculate password strength
    const strength = zxcvbn(password, userInputs);
    setResult(strength);
  }, [password, userInputs, isLoading]);

  if (!password || isLoading) {
    return null;
  }

  if (!result) {
    return null;
  }

  // Score: 0-4 (very weak to very strong)
  const score = result.score;
  const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;

  // Color and label based on score
  const strengthConfig = {
    0: { color: 'bg-red-500', label: 'Very Weak', textColor: 'text-red-600 dark:text-red-400', icon: AlertCircle },
    1: { color: 'bg-orange-500', label: 'Weak', textColor: 'text-orange-600 dark:text-orange-400', icon: AlertCircle },
    2: { color: 'bg-yellow-500', label: 'Fair', textColor: 'text-yellow-600 dark:text-yellow-400', icon: Info },
    3: { color: 'bg-blue-500', label: 'Good', textColor: 'text-blue-600 dark:text-blue-400', icon: Shield },
    4: { color: 'bg-green-500', label: 'Strong', textColor: 'text-green-600 dark:text-green-400', icon: CheckCircle2 }
  };

  const config = strengthConfig[score as keyof typeof strengthConfig];
  const Icon = config.icon;

  // Calculate width percentage (0-4 score to 0-100%)
  const widthPercentage = ((score + 1) / 5) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${config.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex items-center gap-1 min-w-[100px]">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="space-y-1">
          {/* Crack time estimate */}
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Time to crack: <span className="font-medium">{crackTime}</span>
          </p>

          {/* Warning */}
          {result.feedback.warning && (
            <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{result.feedback.warning}</span>
            </div>
          )}

          {/* Suggestions */}
          {result.feedback.suggestions && result.feedback.suggestions.length > 0 && (
            <div className="space-y-1">
              {result.feedback.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Strong password message */}
          {score >= 3 && (
            <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Great! This password is {score === 4 ? 'very ' : ''}secure.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
