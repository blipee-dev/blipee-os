'use client';

import { Droplets } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { WaterDashboard } from '@/components/dashboard/WaterDashboard';

export default function WaterPage() {
  return (
    <DashboardPageBase
      title="Water & Effluents"
      description="GRI 303 • Water withdrawal, discharge & consumption"
      icon={Droplets}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <WaterDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
