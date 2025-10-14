'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAppearance, useAccentGradient } from '@/providers/AppearanceProvider';
import { SiteSelector } from '@/components/zero-typing/SiteSelector';
import { TimePeriodSelector, TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import { designTokens } from '@/styles/design-tokens';
import type { Building } from '@/types/auth';

interface PageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  showFilters?: boolean;
  loadingMessage?: string;
  errorTitle?: string;
  children: (props: {
    organizationId: string;
    selectedSite: Building | null;
    selectedPeriod: TimePeriod;
  }) => ReactNode;
}

/**
 * PageLayout - Universal page wrapper that provides:
 * - Consistent sidebar navigation
 * - Page header with icon, title, and description
 * - Optional site and time period filters
 * - Loading and error states
 * - Organization context
 *
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <PageLayout
 *       title="Energy Management"
 *       description="GRI 302 • Energy consumption & renewable sources"
 *       icon={Zap}
 *       showFilters={true}
 *     >
 *       {({ organizationId, selectedSite, selectedPeriod }) => (
 *         <div>
 *           <MetricCard ... />
 *           <ChartCard ... />
 *         </div>
 *       )}
 *     </PageLayout>
 *   );
 * }
 * ```
 */
export function PageLayout({
  title,
  description,
  icon: Icon,
  showFilters = true,
  loadingMessage,
  errorTitle,
  children,
}: PageLayoutProps) {
  const { user } = useAuth();
  const { settings } = useAppearance();
  const accentGradientConfig = useAccentGradient();
  const accentColorHex = accentGradientConfig.from;
  const accentGradient = accentGradientConfig.gradient;

  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters
  const [selectedSite, setSelectedSite] = useState<Building | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>({
    id: 'current-year',
    label: new Date().getFullYear().toString(),
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear()}-12-31`,
    type: 'year'
  });

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/organization/context');
        const data = await response.json();

        if (response.ok && data.organization) {
          setOrganizationData(data.organization);
        } else {
          setError(data.error || 'Failed to load organization');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [user]);

  if (loading) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <div
              className={designTokens.loading.spinner}
              style={{ borderColor: accentColorHex }}
            />
            <p className="text-gray-400">{loadingMessage || `Loading ${title.toLowerCase()}...`}</p>
          </div>
        </div>
      </SustainabilityLayout>
    );
  }

  if (error) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <AlertCircle className={`${designTokens.icons.extraLarge} text-red-500 mx-auto`} />
            <h3 className="text-xl font-semibold">{errorTitle || `Error Loading ${title}`}</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-3 bg-gradient-to-r ${accentGradient} hover:opacity-90 rounded-xl transition-opacity text-white`}
            >
              Retry
            </button>
          </div>
        </div>
      </SustainabilityLayout>
    );
  }

  return (
    <SustainabilityLayout>
      <div className={designTokens.spacing.sectionPadding}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={designTokens.spacing.sectionGap}
        >
          <div className="flex items-start justify-between mb-6">
            {/* Title and Description */}
            <div>
              <h1 className={`${designTokens.typography.pageTitle} mb-2 flex items-center gap-2`}>
                <Icon className={designTokens.icons.large} style={{ color: accentColorHex }} />
                {title}
              </h1>
              <p className={designTokens.typography.description}>
                {description}
              </p>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="flex items-center gap-3">
                <SiteSelector
                  currentSite={selectedSite}
                  onSiteChange={setSelectedSite}
                />
                <TimePeriodSelector
                  currentPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
                {(selectedSite || selectedPeriod.id !== 'current-year') && (
                  <button
                    onClick={() => {
                      setSelectedSite(null);
                      setSelectedPeriod({
                        id: 'current-year',
                        label: new Date().getFullYear().toString(),
                        start: `${new Date().getFullYear()}-01-01`,
                        end: `${new Date().getFullYear()}-12-31`,
                        type: 'year'
                      });
                    }}
                    className="text-sm transition-opacity hover:opacity-80"
                    style={{ color: accentColorHex }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Page Content */}
        {organizationData && children({
          organizationId: organizationData.id,
          selectedSite,
          selectedPeriod
        })}
      </div>
    </SustainabilityLayout>
  );
}
