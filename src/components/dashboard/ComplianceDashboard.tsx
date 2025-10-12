'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AboutInventory } from '@/components/compliance/AboutInventory';
import { GHGProtocolInventory } from '@/components/compliance/GHGProtocolInventory';
import { GRIEnvironmentalStandards } from '@/components/compliance/GRIEnvironmentalStandards';
import { ESRSE1DisclosuresWrapper } from '@/components/compliance/ESRSE1DisclosuresWrapper';
import { TCFDDisclosuresWrapper } from '@/components/compliance/TCFDDisclosuresWrapper';
import { RecommendedMetricsPanel } from '@/components/sustainability/RecommendedMetricsPanel';
import { FileCheck, Info } from 'lucide-react';

interface ComplianceDashboardProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function ComplianceDashboard({ organizationId, selectedSite, selectedPeriod }: ComplianceDashboardProps) {
  // Use selectedPeriod to determine the year, or default to current year
  const [selectedYear, setSelectedYear] = useState(() => {
    if (selectedPeriod?.year) return selectedPeriod.year;
    if (selectedPeriod?.start) return new Date(selectedPeriod.start).getFullYear();
    return new Date().getFullYear();
  });

  const [orgIndustry, setOrgIndustry] = useState<{
    industry: string;
    region: string;
    size: string;
  }>({ industry: 'professional_services', region: 'EU', size: '100-300' });

  // Update selectedYear when selectedPeriod changes
  React.useEffect(() => {
    if (selectedPeriod?.year) {
      setSelectedYear(selectedPeriod.year);
    } else if (selectedPeriod?.start) {
      setSelectedYear(new Date(selectedPeriod.start).getFullYear());
    }
  }, [selectedPeriod]);

  // Fetch industry settings
  React.useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const industryResponse = await fetch('/api/organizations/industry');
        const industryResult = await industryResponse.json();

        if (industryResult && industryResult.industry) {
          setOrgIndustry({
            industry: industryResult.industry,
            region: industryResult.region || 'EU',
            size: industryResult.company_size_category || '100-300'
          });
        }
      } catch (error) {
        console.error('Error fetching industry:', error);
      }
    };

    fetchIndustry();
  }, []);

  // Check if viewing historical data
  const isHistoricalYear = selectedYear < new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <FileCheck className="w-6 h-6 text-green-600 dark:text-green-500" />
          Compliance Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          GHG Protocol • GRI • ESRS E1 • TCFD
        </p>
      </div>

      {/* Historical Data Notice */}
      {isHistoricalYear && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                Viewing Historical Compliance Data ({selectedYear})
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                This data is read-only to maintain audit trails and data integrity. All editing capabilities are disabled for past years.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="underline" className="w-full">
          <TabsTrigger value="overview" variant="underline" color="#64748b">Overview</TabsTrigger>
          <TabsTrigger value="ghg-protocol" variant="underline" color="#16A34A">GHG Protocol</TabsTrigger>
          <TabsTrigger value="gri" variant="underline" color="#16A34A">GRI</TabsTrigger>
          <TabsTrigger value="esrs" variant="underline" color="#3B82F6">ESRS E1</TabsTrigger>
          <TabsTrigger value="tcfd" variant="underline" color="#0EA5E9">TCFD</TabsTrigger>
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
