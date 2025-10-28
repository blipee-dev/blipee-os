"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare, AlertTriangle, TrendingUp, FileText, Smartphone, Check, X, Loader2 } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import toast from "react-hot-toast";

export default function NotificationsSettingsPage() {
  useAuthRedirect('/settings/notifications');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Real push notification state from hook
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    permission: pushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();

  // Show error toast if there's a push error
  useEffect(() => {
    if (pushError) {
      toast.error(`Push notification error: ${pushError}`);
    }
  }, [pushError]);

  // Handle push notification toggle
  const handlePushToggle = async () => {
    if (!isPushSupported) {
      toast.error('Push notifications are not supported in your browser');
      return;
    }

    try {
      if (isPushSubscribed) {
        // Unsubscribe
        const success = await unsubscribePush();
        if (success) {
          toast.success('Push notifications disabled');
        } else {
          toast.error('Failed to disable push notifications');
        }
      } else {
        // Subscribe
        const success = await subscribePush();
        if (success) {
          toast.success('Push notifications enabled! 🔔');
        } else {
          toast.error('Failed to enable push notifications. Please check browser permissions.');
        }
      }
    } catch (error: any) {
      console.error('Push toggle error:', error);
      toast.error(error.message || 'Failed to toggle push notifications');
    }
  };

  // Send test push notification
  const handleSendTestPush = async () => {
    if (!isPushSubscribed) {
      toast.error('Please enable push notifications first');
      return;
    }

    setIsSendingTest(true);

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Test notification sent! Check your device 📱');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error: any) {
      console.error('Test push error:', error);
      toast.error(error.message || 'Failed to send test notification');
    } finally {
      setIsSendingTest(false);
    }
  };

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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#757575]" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </p>
                    {isPushLoading && (
                      <Loader2 className="w-4 h-4 text-[#757575] animate-spin" />
                    )}
                    {!isPushSupported && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-[#2a2a2a] text-[#616161] rounded">
                        Not Supported
                      </span>
                    )}
                    {isPushSupported && isPushSubscribed && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {isPushSupported && !isPushSubscribed && pushPermission === 'denied' && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-[#616161] dark:text-[#757575]">
                    {!isPushSupported && 'Not supported in your browser'}
                    {isPushSupported && isPushSubscribed && 'Receiving push notifications'}
                    {isPushSupported && !isPushSubscribed && pushPermission === 'denied' && 'Permission denied - enable in browser settings'}
                    {isPushSupported && !isPushSubscribed && pushPermission !== 'denied' && 'Browser and mobile push notifications'}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={!isPushSupported || isPushLoading || pushPermission === 'denied'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPushSubscribed ? "accent-bg" : "bg-gray-300 dark:bg-[#616161]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPushSubscribed ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Push notification status and test button */}
            {isPushSupported && isPushSubscribed && (
              <div className="ml-8 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      Active Subscription
                    </p>
                  </div>
                  <button
                    onClick={handleSendTestPush}
                    disabled={isSendingTest}
                    className="text-xs px-3 py-1.5 accent-bg accent-text rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isSendingTest ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Bell className="w-3 h-3" />
                        Send Test
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#616161] dark:text-[#757575]">
                  You'll receive notifications for important updates and AI agent insights.
                </p>
              </div>
            )}

            {/* Permission denied help text */}
            {isPushSupported && pushPermission === 'denied' && (
              <div className="ml-8 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                  Push notifications are blocked
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  To enable, click the lock icon in your browser's address bar and allow notifications.
                </p>
              </div>
            )}
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
