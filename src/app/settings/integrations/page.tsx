"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Puzzle,
  Check,
  X,
  Settings,
  MessageSquare,
  Users,
  Calendar,
  Cloud,
  Hexagon,
  BarChart3
} from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

const integrations = [
  {
    id: 1,
    name: "Slack",
    description: "Get notifications and alerts in your Slack workspace",
    icon: MessageSquare,
    connected: true,
  },
  {
    id: 2,
    name: "Microsoft Teams",
    description: "Integrate with Microsoft Teams for collaboration",
    icon: Users,
    connected: false,
  },
  {
    id: 3,
    name: "Google Calendar",
    description: "Sync events and schedule reports automatically",
    icon: Calendar,
    connected: true,
  },
  {
    id: 4,
    name: "Salesforce",
    description: "Connect your CRM data with sustainability metrics",
    icon: Cloud,
    connected: false,
  },
  {
    id: 5,
    name: "SAP",
    description: "Import data from SAP systems",
    icon: Hexagon,
    connected: false,
  },
  {
    id: 6,
    name: "Power BI",
    description: "Export data to Power BI for advanced analytics",
    icon: BarChart3,
    connected: true,
  },
];

export default function IntegrationsSettingsPage() {
  useAuthRedirect('/settings/integrations');
  
  return (
    <SettingsLayout pageTitle="Integrations">
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">Connect blipee OS with your favorite tools and services</p>
      </header>

      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#212121] rounded-lg flex items-center justify-center">
                  <integration.icon className="w-6 h-6 text-[#616161] dark:text-[#757575]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {integration.name}
                  </h3>
                  {integration.connected && (
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Connected</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
              </button>
            </div>
            
            <p className="text-sm text-[#616161] dark:text-[#757575] mb-4">
              {integration.description}
            </p>
            
            {integration.connected ? (
              <button className="w-full px-4 py-2 bg-gray-100 dark:bg-[#212121] text-[#616161] dark:text-[#757575] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-sm font-medium">
                Disconnect
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 accent-gradient-lr text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Connect
              </motion.button>
            )}
          </motion.div>
        ))}
        </div>
      </main>
    </SettingsLayout>
  );
}
