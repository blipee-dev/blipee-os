"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import type { Organization } from "@/types/auth";

export function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { session, organization, switchOrganization } = useAuth();

  if (!session || session.organizations.length <= 1) {
    return null;
  }

  const currentOrg = organization || session.current_organization;

  function handleOrgSelect(org: Organization) {
    switchOrganization(org.id);
    setIsOpen(false);
  }

  function getSubscriptionBadge(tier: string) {
    const badges = {
      starter: { label: "Starter", color: "bg-gray-100 text-gray-700" },
      professional: { label: "Pro", color: "bg-blue-100 text-blue-700" },
      enterprise: {
        label: "Enterprise",
        color: "bg-purple-100 text-purple-700",
      },
    };
    return badges[tier as keyof typeof badges] || badges.starter;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
      >
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {currentOrg?.name || "Select Organization"}
            </p>
            {currentOrg && (
              <p className="text-xs text-gray-500">
                {session.organizations.length}{" "}
                {session.organizations.length === 1
                  ? "organization"
                  : "organizations"}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  Switch Organization
                </h3>
              </div>

              <div className="py-2 max-h-96 overflow-y-auto">
                {session.organizations.map((org) => {
                  const isActive = currentOrg?.id === org.id;
                  const badge = getSubscriptionBadge(org.subscription_tier);

                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSelect(org)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                        isActive ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            isActive
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                              : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600"}`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {org.name}
                          </p>
                          <div className="flex items-center mt-1 space-x-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            {org.metadata?.['member_count'] && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {org.metadata['member_count']}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage billing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
