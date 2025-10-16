'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AboutInventory } from '@/components/compliance/AboutInventory';
import { GHGProtocolInventory } from '@/components/compliance/GHGProtocolInventory';
import { GRIEnvironmentalStandards } from '@/components/compliance/GRIEnvironmentalStandards';
import { ESRSE1DisclosuresWrapper } from '@/components/compliance/ESRSE1DisclosuresWrapper';
import { TCFDDisclosuresWrapper } from '@/components/compliance/TCFDDisclosuresWrapper';
import { RecommendedMetricsPanel } from '@/components/sustainability/RecommendedMetricsPanel';
import { FileCheck, Info } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslations } from '@/providers/LanguageProvider';
import { useComplianceDashboard } from '@/hooks/useDashboardData';

interface ComplianceDashboardProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function ComplianceDashboard({ organizationId, selectedSite, selectedPeriod }: ComplianceDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations('sustainability.compliance');

  // Fetch compliance data using React Query
  const { userRole, industry, isLoading } = useComplianceDashboard();

  // Initialize compliance tab from URL or default to 'overview'
  const [complianceTab, setComplianceTab] = useState<string>(() => {
    const subtabFromUrl = searchParams.get('subtab');
    return subtabFromUrl || 'overview';
  });

  // Process user role data
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (userRole.data) {
      setIsSuperAdmin(userRole.data.isSuperAdmin || false);
    }
  }, [userRole.data]);

  // Use selectedPeriod to determine the year, or default to current year
  const [selectedYear, setSelectedYear] = useState(() => {
    if (selectedPeriod?.year) return selectedPeriod.year;
    if (selectedPeriod?.start) return new Date(selectedPeriod.start).getFullYear();
    return new Date().getFullYear();
  });

  // Process industry data
  const [orgIndustry, setOrgIndustry] = useState<{
    industry: string;
    region: string;
    size: string;
  }>({ industry: 'professional_services', region: 'EU', size: '100-300' });

  useEffect(() => {
    if (industry.data && industry.data.industry) {
      setOrgIndustry({
        industry: industry.data.industry,
        region: industry.data.region || 'EU',
        size: industry.data.company_size_category || '100-300'
      });
    }
  }, [industry.data]);

  // Sync URL when compliance tab changes
  useEffect(() => {
    const currentSubtab = searchParams.get('subtab');
    if (currentSubtab !== complianceTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('subtab', complianceTab);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [complianceTab, router, searchParams]);

  // Sync complianceTab when URL changes (browser back/forward)
  useEffect(() => {
    const subtabFromUrl = searchParams.get('subtab');
    if (subtabFromUrl && subtabFromUrl !== complianceTab) {
      setComplianceTab(subtabFromUrl);
    }
  }, [searchParams]);

  // Redirect non-admins trying to access restricted tabs via URL
  useEffect(() => {
    const subtab = searchParams.get('subtab');
    if (!isSuperAdmin && (subtab === 'esrs' || subtab === 'tcfd')) {
      setComplianceTab('overview');
      const params = new URLSearchParams(searchParams.toString());
      params.set('subtab', 'overview');
      router.replace(`?${params.toString()}`);
    }
  }, [isSuperAdmin, searchParams, router]);

  // Handle compliance tab change
  const handleComplianceTabChange = (value: string) => {
    setComplianceTab(value);
  };

  // Update selectedYear when selectedPeriod changes
  useEffect(() => {
    if (selectedPeriod?.year) {
      setSelectedYear(selectedPeriod.year);
    } else if (selectedPeriod?.start) {
      setSelectedYear(new Date(selectedPeriod.start).getFullYear());
    }
  }, [selectedPeriod]);

  // Check if viewing historical data
  const isHistoricalYear = selectedYear < new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Historical Data Notice */}
      {isHistoricalYear && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                {t('historicalNotice.title')} {t('historicalNotice.year', { year: selectedYear })}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {t('historicalNotice.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={complianceTab} onValueChange={handleComplianceTabChange} className="w-full">
        <TabsList variant="underline" className="w-full">
          <TabsTrigger value="overview" variant="underline" color="#64748b">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="ghg-protocol" variant="underline" color="#16A34A">{t('tabs.ghgProtocol')}</TabsTrigger>
          <TabsTrigger value="gri" variant="underline" color="#16A34A">{t('tabs.gri')}</TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="esrs" variant="underline" color="#3B82F6">{t('tabs.esrs')}</TabsTrigger>
              <TabsTrigger value="tcfd" variant="underline" color="#0EA5E9">{t('tabs.tcfd')}</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <AboutInventory
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />

          {/* Recommended Metrics - Only show for current year */}
          {selectedYear === new Date().getFullYear() && (
            <RecommendedMetricsPanel
              organizationId={organizationId}
              industry={orgIndustry.industry}
              region={orgIndustry.region}
              size={orgIndustry.size}
            />
          )}
        </TabsContent>

        {/* GHG Protocol Tab */}
        <TabsContent value="ghg-protocol" className="space-y-6 mt-6">
          <GHGProtocolInventory
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        </TabsContent>

        {/* GRI Tab */}
        <TabsContent value="gri" className="space-y-6 mt-6">
          <GRIEnvironmentalStandards
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        </TabsContent>

        {/* ESRS E1 Tab */}
        <TabsContent value="esrs" className="space-y-6 mt-6">
          <ESRSE1DisclosuresWrapper
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        </TabsContent>

        {/* TCFD Tab */}
        <TabsContent value="tcfd" className="space-y-6 mt-6">
          <TCFDDisclosuresWrapper
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
