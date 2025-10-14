'use client';

import React, { ReactNode, useState } from 'react';
import { LucideIcon, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { designTokens } from '@/styles/design-tokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  tooltip?: string;
  className?: string;
}

/**
 * MetricCard - Standardized card for displaying key metrics
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Emissions"
 *   value={1234.5}
 *   unit="tCO2e"
 *   icon={Cloud}
 *   iconColor="#8B5CF6"
 *   trend={{ value: -5.2, label: "YoY" }}
 *   tooltip="Total greenhouse gas emissions across all scopes"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  iconColor,
  trend,
  subtitle,
  tooltip,
  className = '',
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTrendColor = (trendValue: number) => {
    if (trendValue < 0) return designTokens.colors.status.success;
    if (trendValue > 0) return designTokens.colors.status.danger;
    return designTokens.colors.status.neutral;
  };

  const TrendIcon = trend && trend.value < 0 ? TrendingDown : TrendingUp;

  return (
    <div className={`${designTokens.glassMorphism.card} ${designTokens.spacing.cardPadding} relative ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={designTokens.icons.medium} style={{ color: iconColor }} />
        <span className={designTokens.typography.cardTitle}>{title}</span>

        {tooltip && (
          <div className="relative ml-auto">
            <Info
              className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            />
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <div className={designTokens.typography.metricValue}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </div>
      </div>

      {/* Unit and Trend */}
      <div className="flex items-center justify-between">
        <div className={designTokens.typography.metricUnit}>{unit}</div>

        {trend && (
          <div className="flex items-center gap-1">
            <TrendIcon
              className="w-3 h-3"
              style={{ color: getTrendColor(trend.value) }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: getTrendColor(trend.value) }}
            >
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%{trend.label ? ` ${trend.label}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className={`${designTokens.typography.label} text-purple-500 dark:text-purple-400`}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
