'use client';

import { Cloud } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { EmissionsDashboard } from '@/components/dashboard/EmissionsDashboard';

export default function GHGEmissionsPage() {
  return (
    <DashboardPageBase
      title="GHG Emissions"
      description="GHG Protocol • GRI 305 • ESRS E1 • TCFD"
      icon={Cloud}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <EmissionsDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
