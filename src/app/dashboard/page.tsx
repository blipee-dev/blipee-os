"use client";

import React from "react";
import { ConversationInterface } from "@/components/blipee-os/ConversationInterface";
import { useAuth } from "@/lib/auth/context";
import { Leaf, TrendingDown, Target, FileText } from "lucide-react";

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

  return (
    <div className="h-full relative">
      {/* Quick stats banner */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Monthly Reduction
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    -12.3%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Target Progress
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    67%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Reports Ready
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    3 new
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Leaf className="w-4 h-4 text-green-500" />
              <span>Sustainability First Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main conversation interface with padding for stats banner */}
      <div className="h-full pt-16">
        <ConversationInterface buildingContext={sustainabilityContext} />
      </div>
    </div>
  );
}
