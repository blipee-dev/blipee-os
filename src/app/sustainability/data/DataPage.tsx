'use client';

import { Database } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { DataManagementDashboard } from '@/components/dashboard/DataManagementDashboard';

export default function DataPage() {
  return (
    <DashboardPageBase
      title="Data Management"
      description="Metrics data management & historical tracking"
      icon={Database}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <DataManagementDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
