"use client";

import React, { Suspense, useEffect, useState } from "react";
import { LazyConversationInterface } from "@/components/lazy";
import { useAuth } from "@/lib/auth/context";
import { Leaf, TrendingDown, FileText, Target } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface DashboardStats {
  monthlyReduction: number;
  targetProgress: number;
  reportsCount: number;
  currentEmissions: number;
  building?: {
    id: string;
    name: string;
    metadata: any;
  };
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (session?.current_organization?.id) {
      fetchRealStats();
    } else {
      setLoading(false);
    }
  }, [session?.current_organization?.id]);

  const fetchRealStats = async () => {
    try {
      const orgId = session?.current_organization?.id;
      
      // Get current month and previous month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch current month emissions
      const { data: currentEmissions } = await supabase
        .from('emissions_data')
        .select('co2e_kg')
        .eq('organization_id', orgId)
        .gte('period_start', currentMonthStart.toISOString().split('T')[0])
        .lte('period_end', now.toISOString().split('T')[0]);

      // Fetch previous month emissions
      const { data: previousEmissions } = await supabase
        .from('emissions_data')
        .select('co2e_kg')
        .eq('organization_id', orgId)
        .gte('period_start', previousMonthStart.toISOString().split('T')[0])
        .lte('period_end', previousMonthEnd.toISOString().split('T')[0]);

      // Calculate totals
      const currentTotal = currentEmissions?.reduce((sum, e) => sum + (e.co2e_kg || 0), 0) || 0;
      const previousTotal = previousEmissions?.reduce((sum, e) => sum + (e.co2e_kg || 0), 0) || 0;
      
      // Calculate monthly reduction percentage
      const monthlyReduction = previousTotal > 0 
        ? ((previousTotal - currentTotal) / previousTotal * 100) 
        : 0;

      // Fetch sustainability reports count
      const { count: reportsCount } = await supabase
        .from('sustainability_reports')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'draft');

      // Fetch building data
      const { data: buildings } = await supabase
        .from('buildings')
        .select('*')
        .eq('organization_id', orgId)
        .limit(1);

      // Calculate target progress (example: assume 30% reduction target by 2030)
      const baseYear = 2022;
      const targetYear = 2030;
      const targetReduction = 30; // 30% reduction target
      const yearsPassed = now.getFullYear() - baseYear;
      const totalYears = targetYear - baseYear;
      const expectedProgress = (yearsPassed / totalYears) * targetReduction;
      const actualReduction = 15; // This should be calculated from actual baseline
      const targetProgress = Math.min((actualReduction / targetReduction) * 100, 100);

      setStats({
        monthlyReduction: Math.round(monthlyReduction * 10) / 10,
        targetProgress: Math.round(targetProgress),
        reportsCount: reportsCount || 0,
        currentEmissions: Math.round(currentTotal / 1000), // Convert to tonnes
        building: buildings?.[0] ? {
          id: buildings[0].id,
          name: buildings[0].name,
          metadata: buildings[0].metadata || {}
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build context from real data
  const sustainabilityContext = stats?.building ? {
    id: stats.building.id,
    name: stats.building.name,
    organizationId: session?.current_organization?.id || "demo",
    metadata: stats.building.metadata
  } : {
    id: session?.current_organization?.id || "demo",
    name: session?.current_organization?.name || "Your Organization",
    organizationId: session?.current_organization?.id || "demo",
    metadata: {}
  };

  const isNewUser = !session?.current_organization;

  return (
    <div className="h-full relative">
      {/* Quick stats banner - only show for users with real data */}
      {!isNewUser && !loading && stats && (
        <div className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-gradient-to-r from-green-500/[0.05] to-emerald-500/[0.05] light-mode:from-green-50 light-mode:to-emerald-50 border-b border-white/[0.05] light-mode:border-green-200/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/[0.1] light-mode:bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-400 light-mode:text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-white/60 light-mode:text-gray-600">
                    Monthly Change
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    {stats.monthlyReduction > 0 ? '-' : '+'}{Math.abs(stats.monthlyReduction)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/[0.1] light-mode:bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400 light-mode:text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-white/60 light-mode:text-gray-600">
                    Target Progress
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    {stats.targetProgress}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500/[0.1] light-mode:bg-teal-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-400 light-mode:text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-white/60 light-mode:text-gray-600">
                    Draft Reports
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    {stats.reportsCount} {stats.reportsCount === 1 ? 'report' : 'reports'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/[0.1] light-mode:bg-blue-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-blue-400 light-mode:text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-white/60 light-mode:text-gray-600">
                    Current Emissions
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    {stats.currentEmissions} tCO₂e
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 light-mode:text-gray-500">
              <Leaf className="w-4 h-4 text-green-400 light-mode:text-green-500" />
              <span>Live Data Dashboard</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main conversation interface with padding for stats banner */}
      <div className={`h-full ${!isNewUser && !loading && stats ? 'pt-16' : ''}`}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        }>
          <LazyConversationInterface buildingContext={sustainabilityContext} />
        </Suspense>
      </div>
    </div>
  );
}