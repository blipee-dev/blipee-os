'use client';

import { Trash2 } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { WasteDashboard } from '@/components/dashboard/WasteDashboard';

export default function WastePage() {
  return (
    <DashboardPageBase
      title="Waste"
      description="GRI 306 • Waste generation, diversion & disposal"
      icon={Trash2}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <WasteDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
