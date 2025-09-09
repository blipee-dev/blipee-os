"use client";

import React, { Suspense } from "react";
import { LazyConversationInterface } from "@/components/lazy";
import { useAuth } from "@/lib/auth/context";
import { Leaf, TrendingDown, FileText, Target } from "lucide-react";

export default function DashboardPage() {
  const { session } = useAuth();

  // For now, we'll use a simplified context that focuses on sustainability
  // In the future, this can be enhanced with actual organization/building data
  const sustainabilityContext = {
    id: session?.current_organization?.id || "demo",
    name: session?.current_organization?.name || "Your Organization",
    organizationId: session?.current_organization?.id || "demo",
    metadata: {
      size_sqft: 50000,
      floors: 5,
      occupancy_types: ["office", "mixed"],
      age_category: "modern",
      systems_baseline: { type: "sustainable" },
    },
  };

  // Don't show mock stats for new users
  const isNewUser = !session?.current_organization;

  return (
    <div className="h-full relative">
      {/* Quick stats banner - only show for users with data */}
      {!isNewUser && (
        <div className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/[0.05] dark:to-emerald-500/[0.05] border-b border-green-200/50 dark:border-white/[0.05]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-500/[0.1] rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    Monthly Reduction
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    -12.3%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/[0.1] rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    Target Progress
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    67%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-500/[0.1] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    Reports Ready
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    3 new
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
              <Leaf className="w-4 h-4 text-green-500 dark:text-green-400" />
              <span>Sustainability First Platform</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main conversation interface with padding for stats banner */}
      <div className={`h-full ${!isNewUser ? 'pt-16' : ''}`}>
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
