'use client';

import { Zap } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { EnergyDashboard } from '@/components/dashboard/EnergyDashboard';

export default function EnergyPage() {
  return (
    <DashboardPageBase>
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
