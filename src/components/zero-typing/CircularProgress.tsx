'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  label,
  sublabel,
  unit = '',
  size = 'md',
  color = 'from-blue-500 to-purple-500',
  showPercentage = true
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const radius = size === 'sm' ? 35 : size === 'md' ? 50 : size === 'lg' ? 65 : 80;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : size === 'lg' ? 5 : 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const dimensions = {
    sm: { width: 80, height: 80, fontSize: 'text-sm' },
    md: { width: 120, height: 120, fontSize: 'text-lg' },
    lg: { width: 160, height: 160, fontSize: 'text-xl' },
    xl: { width: 200, height: 200, fontSize: 'text-2xl' }
  };

  const dim = dimensions[size];

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: dim.width, height: dim.height }}>
        <svg
          width={dim.width}
          height={dim.height}
          className="absolute transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            className="text-gray-200 dark:text-white/10"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={dim.width / 2}
            cy={dim.height / 2}
          />
          {/* Progress circle */}
          <motion.circle
            stroke="url(#gradient)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={dim.width / 2}
            cy={dim.height / 2}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`text-gradient-from ${color.split(' ')[0]}`} />
              <stop offset="100%" className={`text-gradient-to ${color.split(' ')[2]}`} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className={`font-bold text-gray-900 dark:text-white ${dim.fontSize}`}>
            {showPercentage ? `${Math.round(percentage)}%` : value.toLocaleString()}
          </div>
          {unit && !showPercentage && (
            <div className="text-xs text-gray-600 dark:text-white/60">{unit}</div>
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-gray-600 dark:text-white/60">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

// Circular Progress Group component for displaying multiple metrics
export const CircularProgressGroup: React.FC<{
  metrics: Array<{
    value: number;
    max: number;
    label: string;
    sublabel?: string;
    unit?: string;
    color?: string;
  }>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ metrics, size = 'md' }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex justify-center"
        >
          <CircularProgress
            value={metric.value}
            max={metric.max}
            label={metric.label}
            sublabel={metric.sublabel}
            unit={metric.unit}
            size={size}
            color={metric.color}
            showPercentage={!metric.unit}
          />
        </motion.div>
      ))}
    </div>
  );
};