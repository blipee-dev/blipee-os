"use client";

import React from "react";
import { motion } from "framer-motion";
import { Puzzle, Check, X, Settings } from "lucide-react";

const integrations = [
  {
    id: 1,
    name: "Slack",
    description: "Get notifications and alerts in your Slack workspace",
    icon: "💬",
    connected: true,
  },
  {
    id: 2,
    name: "Microsoft Teams",
    description: "Integrate with Microsoft Teams for collaboration",
    icon: "👥",
    connected: false,
  },
  {
    id: 3,
    name: "Google Calendar",
    description: "Sync events and schedule reports automatically",
    icon: "📅",
    connected: true,
  },
  {
    id: 4,
    name: "Salesforce",
    description: "Connect your CRM data with sustainability metrics",
    icon: "☁️",
    connected: false,
  },
  {
    id: 5,
    name: "SAP",
    description: "Import data from SAP systems",
    icon: "🔷",
    connected: false,
  },
  {
    id: 6,
    name: "Power BI",
    description: "Export data to Power BI for advanced analytics",
    icon: "📊",
    connected: true,
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Integrations
        </h1>
        <p className="text-[#616161] dark:text-[#757575]">
          Connect blipee OS with your favorite tools and services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#212121] rounded-lg flex items-center justify-center text-2xl">
                  {integration.icon}
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
              <button className="w-full px-4 py-2 bg-gray-100 dark:bg-[#212121] text-[#616161] dark:text-[#757575] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.05] transition-colors text-sm font-medium">
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
    </div>
  );
}
