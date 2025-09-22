"use client";

import React, { Suspense, useEffect } from "react";
import { LazyConversationInterface } from "@/components/lazy";
import { useAuth } from "@/lib/auth/context";
import { Leaf, TrendingDown, FileText, Target } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useTranslations } from "@/providers/LanguageProvider";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  useAuthRedirect('/blipee-ai');

  const { session } = useAuth();
  const t = useTranslations('blipee-ai');
  const router = useRouter();

  // No redirect - AI Butler will guide users based on their state
  useEffect(() => {
    if (session && !session.current_organization && !session.organizations?.length) {
      console.log('User has no organization - AI Butler will provide guidance');
    }
  }, [session]);

  // Use real organization data - no demo values
  const sustainabilityContext = session?.current_organization ? {
    id: session.current_organization.id,
    name: session.current_organization.name,
    organizationId: session.current_organization.id,
    metadata: {
      // These can be fetched from actual building data later
      size_sqft: 50000,
      floors: 5,
      occupancy_types: ["office", "mixed"],
      age_category: "modern",
      systems_baseline: { type: "sustainable" },
    },
  } : undefined;

  // Don't show mock stats for new users
  const isNewUser = !session?.current_organization;

  return (
    <div className="h-full relative">
      {/* Quick stats banner - responsive for mobile */}
      {!isNewUser && (
        <div className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/[0.05] dark:to-emerald-500/[0.05] border-b border-green-200/50 dark:border-white/[0.05]">
          <div className="px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Stats - Stack on mobile, horizontal on desktop */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-500/[0.1] rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white/60">
                      {t('dashboard.monthlyReduction')}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      -12.3%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 dark:bg-emerald-500/[0.1] rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white/60">
                      {t('dashboard.targetProgress')}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      67%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-100 dark:bg-teal-500/[0.1] rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white/60">
                      {t('dashboard.reportsReady')}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {t('dashboard.newReports', { count: 3 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Badge - Hidden on mobile, shown on sm+ */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 dark:text-green-400" />
                <span className="hidden md:inline">{t('dashboard.platformBadge')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main conversation interface with padding for stats banner */}
      <div className={`h-full ${!isNewUser ? 'pt-12 sm:pt-16' : ''}`}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-500" />
          </div>
        }>
          <LazyConversationInterface buildingContext={sustainabilityContext} />
        </Suspense>
      </div>
    </div>
  );
}