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

  // Don't show mock stats for new users
  const isNewUser = !session?.current_organization;

  return (
    <div className="h-full relative">
      {/* Quick stats banner - only show for users with data */}
      {!isNewUser && (
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
                    Monthly Reduction
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    -12.3%
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
                    67%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500/[0.1] light-mode:bg-teal-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-400 light-mode:text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-white/60 light-mode:text-gray-600">
                    Reports Ready
                  </p>
                  <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                    3 new
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 light-mode:text-gray-500">
              <Leaf className="w-4 h-4 text-green-400 light-mode:text-green-500" />
              <span>Sustainability First Platform</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main conversation interface with padding for stats banner */}
      <div className={`h-full ${!isNewUser ? 'pt-16' : ''}`}>
        <ConversationInterface buildingContext={sustainabilityContext} />
      </div>
    </div>
  );
}
