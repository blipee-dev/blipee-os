'use client';

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '@/styles/design-tokens';

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

/**
 * StatCard - Flexible card for displaying detailed statistics and data
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Organizational Boundaries"
 *   icon={Building2}
 *   iconColor="#6366F1"
 * >
 *   <div className="space-y-3">
 *     <div>
 *       <div className="text-xs text-gray-500 mb-1">Consolidation Approach</div>
 *       <div className="text-base font-semibold">Operational Control</div>
 *     </div>
 *     <div>
 *       <div className="text-xs text-gray-500 mb-1">Sites Included</div>
 *       <div className="text-base font-semibold">12/15</div>
 *     </div>
 *   </div>
 * </StatCard>
 * ```
 */
export function StatCard({
  title,
  icon: Icon,
  iconColor,
  children,
  className = '',
}: StatCardProps) {
  return (
    <div className={`${designTokens.glassMorphism.card} ${designTokens.spacing.cardPadding} ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className={designTokens.icons.medium} style={{ color: iconColor }} />
        <h3 className={designTokens.typography.sectionTitle}>{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
