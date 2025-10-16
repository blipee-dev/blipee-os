'use client';

import { Cloud } from 'lucide-react';
import { PageLayout } from '@/components/design-system';
import { EmissionsDashboard } from '@/components/dashboard/EmissionsDashboard';

/**
 * GHG Emissions Page - Refactored to use Design System
 *
 * Uses the unified PageLayout component for consistent navigation,
 * filters, and styling across all sustainability pages.
 */
export default function GHGEmissionsPage() {
  return (
    <PageLayout
      title="GHG Emissions"
      description="Comprehensive Scope 1, 2 & 3 emissions tracking and analysis • GHG Protocol • GRI 305 • ESRS E1"
      icon={Cloud}
      showFilters={true}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <EmissionsDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </PageLayout>
  );
}
