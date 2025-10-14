'use client';

import React, { ReactNode, useState } from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { designTokens } from '@/styles/design-tokens';

interface FrameworkBadge {
  label: string;
  type: 'ghg' | 'gri' | 'tcfd' | 'esrs' | 'sbti';
}

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  tooltip?: string;
  badges?: FrameworkBadge[];
  children: ReactNode;
  height?: 'chart' | 'table' | string;
  className?: string;
}

/**
 * ChartCard - Standardized card for displaying charts and visualizations
 *
 * @example
 * ```tsx
 * <ChartCard
 *   title="Emissions Trend"
 *   icon={TrendingUp}
 *   iconColor="#8B5CF6"
 *   tooltip="Monthly emissions data with ML forecasting"
 *   badges={[
 *     { label: "TCFD", type: "tcfd" },
 *     { label: "ESRS E1", type: "esrs" }
 *   ]}
 * >
 *   <ResponsiveContainer width="100%" height={320}>
 *     <LineChart data={data}>
 *       ...
 *     </LineChart>
 *   </ResponsiveContainer>
 * </ChartCard>
 * ```
 */
export function ChartCard({
  title,
  icon: Icon,
  iconColor,
  tooltip,
  badges = [],
  children,
  height = 'chart',
  className = '',
}: ChartCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeClass = (type: FrameworkBadge['type']) => {
    return designTokens.badges[type];
  };

  const cardHeight = height === 'chart'
    ? designTokens.cardHeights.chart
    : height === 'table'
    ? designTokens.cardHeights.table
    : height;

  return (
    <div className={`${designTokens.glassMorphism.card} ${designTokens.spacing.cardPadding} ${cardHeight} flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 relative">
          <Icon className={designTokens.icons.medium} style={{ color: iconColor }} />
          <h3 className={designTokens.typography.sectionTitle}>{title}</h3>

          {tooltip && (
            <div className="relative">
              <Info
                className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
              />
              {showTooltip && (
                <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Framework Badges */}
        {badges.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {badges.map((badge, index) => (
              <span key={index} className={getBadgeClass(badge.type)}>
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
