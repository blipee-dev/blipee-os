'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AboutInventory } from '@/components/compliance/AboutInventory';
import { GRI305Disclosures } from '@/components/compliance/GRI305Disclosures';
import { ESRSE1DisclosuresWrapper } from '@/components/compliance/ESRSE1DisclosuresWrapper';
import { TCFDDisclosuresWrapper } from '@/components/compliance/TCFDDisclosuresWrapper';
import { GHGProtocolInventory } from '@/components/compliance/GHGProtocolInventory';
import { AlertCircle, FileCheck, Info } from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';

export default function ComplianceDashboardPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <SustainabilityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              GHG Protocol • GRI • ESRS E1 • TCFD
            </p>
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ghg-protocol">GHG Protocol</TabsTrigger>
            <TabsTrigger value="gri">GRI</TabsTrigger>
            <TabsTrigger value="esrs">ESRS E1</TabsTrigger>
            <TabsTrigger value="tcfd">TCFD</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <AboutInventory />

            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-lg p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Info className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Compliance Dashboard Ready
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The compliance framework has been successfully implemented with support for:
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      GHG Protocol Corporate Standard (Scope 1, 2, 3 with dual reporting)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      GRI Standards 305 (Emissions) + 302 (Energy)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ESRS E1 Climate Change (All 9 disclosures)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      TCFD Recommendations (4-pillar structure)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Framework Interoperability (GRI ↔ ESRS ↔ TCFD ↔ IFRS S2)
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-amber-900 dark:text-amber-200 font-medium mb-1">Next Steps</p>
                        <p className="text-amber-800 dark:text-amber-300/80 text-sm">
                          Configure your organization's compliance settings and begin entering emissions data through the main sustainability dashboard.
                          Once data is available, full compliance reports will be generated automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* GHG Protocol Tab */}
          <TabsContent value="ghg-protocol" className="space-y-6 mt-6">
            <GHGProtocolInventory />
          </TabsContent>

          {/* GRI Tab */}
          <TabsContent value="gri" className="space-y-6 mt-6">
            <GRI305Disclosures />
          </TabsContent>

          {/* ESRS E1 Tab */}
          <TabsContent value="esrs" className="space-y-6 mt-6">
            <ESRSE1DisclosuresWrapper />
          </TabsContent>

          {/* TCFD Tab */}
          <TabsContent value="tcfd" className="space-y-6 mt-6">
            <TCFDDisclosuresWrapper />
          </TabsContent>
        </Tabs>
      </div>
    </SustainabilityLayout>
  );
}
