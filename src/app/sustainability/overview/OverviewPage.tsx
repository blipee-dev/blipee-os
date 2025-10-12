'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAppearance, useAccentGradient } from '@/providers/AppearanceProvider';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { SiteSelector } from '@/components/zero-typing/SiteSelector';
import { TimePeriodSelector, TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import type { Building } from '@/types/auth';

export default function OverviewPage() {
  const { user } = useAuth();
  const { settings } = useAppearance();
  const accentGradientConfig = useAccentGradient();
  const accentColorHex = accentGradientConfig.from;

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
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: accentColorHex }}
            />
            <p className="text-gray-400">Loading overview...</p>
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
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-semibold">Error Loading Overview</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 rounded-xl transition-opacity text-white`}
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
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" style={{ color: accentColorHex }} />
                Overview
              </h1>
              <p className="text-[#616161] dark:text-[#757575]">
                Compliance & metrics overview
              </p>
            </div>

            {/* Selectors */}
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
          </div>
        </motion.div>

        {/* Dashboard Content */}
        {organizationData && (
          <OverviewDashboard
            organizationId={organizationData.id}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
      </div>
    </SustainabilityLayout>
  );
}
