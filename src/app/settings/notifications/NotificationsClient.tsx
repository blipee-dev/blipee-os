"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function NotificationsSettingsPage() {
  useAuthRedirect('/settings/notifications');
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const notificationTypes = [
    {
      id: "alerts",
      icon: AlertTriangle,
      title: "Critical Alerts",
      description: "Immediate notifications for system issues and threshold breaches",
      enabled: true,
    },
    {
      id: "reports",
      icon: FileText,
      title: "Report Generation",
      description: "Notifications when reports are ready or scheduled",
      enabled: true,
    },
    {
      id: "trends",
      icon: TrendingUp,
      title: "Trend Updates",
      description: "Weekly summaries of your sustainability metrics",
      enabled: false,
    },
    {
      id: "messages",
      icon: MessageSquare,
      title: "Team Messages",
      description: "Notifications for team mentions and discussions",
      enabled: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Preferences
        </h1>
        <p className="text-[#616161] dark:text-[#757575]">
          Choose how and when you want to be notified
        </p>
      </div>

      {/* Notification Channels */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Channels
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#757575]" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </p>
                <p className="text-xs text-[#616161] dark:text-[#757575]">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? "accent-bg" : "bg-gray-300 dark:bg-[#616161]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#757575]" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Push Notifications
                </p>
                <p className="text-xs text-[#616161] dark:text-[#757575]">
                  Browser and mobile push notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushNotifications ? "accent-bg" : "bg-gray-300 dark:bg-[#616161]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#757575]" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  SMS Notifications
                </p>
                <p className="text-xs text-[#616161] dark:text-[#757575]">
                  Critical alerts via SMS
                </p>
              </div>
            </div>
            <button
              onClick={() => setSmsNotifications(!smsNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                smsNotifications ? "accent-bg" : "bg-gray-300 dark:bg-[#616161]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  smsNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-white/[0.05]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Types
        </h2>
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 accent-bg rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 accent-text" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {type.title}
                    </p>
                    <p className="text-xs text-[#616161] dark:text-[#757575]">
                      {type.description}
                    </p>
                  </div>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    type.enabled ? "accent-bg" : "bg-gray-300 dark:bg-[#616161]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      type.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
