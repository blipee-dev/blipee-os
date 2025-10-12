'use client';

import { FileCheck } from 'lucide-react';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';

export default function CompliancePage() {
  return (
    <DashboardPageBase
      title="Compliance"
      description="GHG Protocol • GRI • ESRS E1 • TCFD"
      icon={FileCheck}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <ComplianceDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
