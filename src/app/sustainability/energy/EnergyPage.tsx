'use client';

import { Zap } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { EnergyDashboard } from '@/components/dashboard/EnergyDashboard';

export default function EnergyPage() {
  return (
    <DashboardPageBase
      title="Energy"
      description="GRI 302 • Energy consumption & renewable sources"
      icon={Zap}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <EnergyDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
