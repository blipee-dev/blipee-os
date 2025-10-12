'use client';

import { Calendar } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { DashboardPageBase } from '@/components/dashboard/DashboardPageBase';
import { MonthlyIntelligentDashboard } from '@/components/dashboard/MonthlyIntelligentDashboard';

export default function IntelligencePage() {
  const { user } = useAuth();

  return (
    <DashboardPageBase
      title="Intelligence"
      description="AI-powered monthly insights & analytics"
      icon={Calendar}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <MonthlyIntelligentDashboard
          organizationId={organizationId}
          userId={user?.id || ''}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      )}
    </DashboardPageBase>
  );
}
