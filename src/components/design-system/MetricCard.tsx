'use client';

import React, { ReactNode, useState } from 'react';
import { LucideIcon, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { designTokens } from '@/styles/design-tokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  subtitleColor?: string;
  tooltip?: string;
  className?: string;
  compact?: boolean; // For 5-column grids
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
  subtitleColor,
  tooltip,
  className = '',
  compact = false,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTrendColor = (trendValue: number) => {
    if (trendValue < 0) return designTokens.colors.status.success;
    if (trendValue > 0) return designTokens.colors.status.danger;
    return designTokens.colors.status.neutral;
  };

  const TrendIcon = trend && trend.value < 0 ? TrendingDown : TrendingUp;

  // Adjust sizing for compact mode (5-column grid)
  const iconSize = compact ? 'w-6 h-6' : 'w-8 h-8';
  const valueSize = compact ? 'text-2xl' : 'text-3xl';
  const padding = compact ? 'p-4' : designTokens.spacing.cardPadding;

  return (
    <div className={`${designTokens.glassMorphism.card} ${padding} relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Icon className={`${iconSize}`} style={{ color: iconColor }} />
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
      <div className={`${valueSize} font-bold text-gray-900 dark:text-white`}>
        {typeof value === 'number' ? (
          value < 1000 ? value.toFixed(1) : (value / 1000).toFixed(1) + 'k'
        ) : value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>

      {/* Trend or Subtitle */}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-sm ${trend.value < 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">{trend.label || 'vs last year'}</span>
        </div>
      )}

      {subtitle && !trend && (
        <div className={`text-sm mt-2 ${subtitleColor || 'text-gray-500'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
