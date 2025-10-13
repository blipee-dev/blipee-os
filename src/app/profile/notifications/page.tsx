"use client";

import React, { useState, useEffect } from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Calendar,
  Shield,
  TrendingUp,
  Users,
  FileText,
  Award,
  AlertCircle,
  ChevronRight,
  Check,
  X,
  Loader2
} from "lucide-react";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface NotificationSettings {
  channels: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  types: {
    systemUpdates: boolean;
    securityAlerts: boolean;
    teamActivity: boolean;
    sustainabilityReports: boolean;
    complianceAlerts: boolean;
    achievements: boolean;
  };
  frequency: {
    reports: "realtime" | "daily" | "weekly" | "monthly" | "never";
    alerts: "realtime" | "daily" | "weekly" | "monthly" | "never";
    updates: "realtime" | "daily" | "weekly" | "monthly" | "never";
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekendsOff: boolean;
  };
  emailPreferences: {
    marketing: boolean;
    productUpdates: boolean;
    newsletter: boolean;
    tips: boolean;
  };
}

const defaultSettings: NotificationSettings = {
  channels: {
    email: true,
    inApp: true,
    push: false,
  },
  types: {
    systemUpdates: true,
    securityAlerts: true,
    teamActivity: true,
    sustainabilityReports: true,
    complianceAlerts: true,
    achievements: true,
  },
  frequency: {
    reports: "weekly",
    alerts: "realtime",
    updates: "daily",
  },
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    weekendsOff: false,
  },
  emailPreferences: {
    marketing: false,
    productUpdates: true,
    newsletter: false,
    tips: true,
  },
};

export default function NotificationsPage() {
  useAuthRedirect('/profile/notifications');

  const t = useTranslations('profile.notifications');
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Define frequency options with translations
  const frequencyOptions = [
    { value: "realtime", label: t('realtime') },
    { value: "daily", label: t('daily') },
    { value: "weekly", label: t('weekly') },
    { value: "monthly", label: t('monthly') },
    { value: "never", label: t('never') },
  ];

  // Check super admin status
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) return;
      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        const isAdmin = data.isSuperAdmin || false;
        setIsSuperAdmin(isAdmin);

        if (!isAdmin) {
          router.push('/profile?error=admin_only');
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        router.push('/profile?error=admin_only');
      } finally {
        setCheckingPermissions(false);
      }
    }
    checkSuperAdmin();
  }, [user, router]);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchNotificationSettings();
    }
  }, [isSuperAdmin]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/profile/notifications');
      if (response.ok) {
        const { data } = await response.json();
        // Deep merge fetched data with defaults to ensure all properties exist
        const mergedSettings = {
          channels: { ...defaultSettings.channels, ...(data.channels || {}) },
          types: { ...defaultSettings.types, ...(data.types || {}) },
          frequency: { ...defaultSettings.frequency, ...(data.frequency || {}) },
          quietHours: { ...defaultSettings.quietHours, ...(data.quietHours || {}) },
          emailPreferences: { ...defaultSettings.emailPreferences, ...(data.emailPreferences || {}) },
        };
        setSettings(mergedSettings);
      } else {
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem("notificationSettings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const mergedSettings = {
              channels: { ...defaultSettings.channels, ...(parsed.channels || {}) },
              types: { ...defaultSettings.types, ...(parsed.types || {}) },
              frequency: { ...defaultSettings.frequency, ...(parsed.frequency || {}) },
              quietHours: { ...defaultSettings.quietHours, ...(parsed.quietHours || {}) },
              emailPreferences: { ...defaultSettings.emailPreferences, ...(parsed.emailPreferences || {}) },
            };
            setSettings(mergedSettings);
          } catch (error) {
            console.error("Failed to parse notification settings:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
      // Fallback to localStorage
      const stored = localStorage.getItem("notificationSettings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const mergedSettings = {
            channels: { ...defaultSettings.channels, ...(parsed.channels || {}) },
            types: { ...defaultSettings.types, ...(parsed.types || {}) },
            frequency: { ...defaultSettings.frequency, ...(parsed.frequency || {}) },
            quietHours: { ...defaultSettings.quietHours, ...(parsed.quietHours || {}) },
            emailPreferences: { ...defaultSettings.emailPreferences, ...(parsed.emailPreferences || {}) },
          };
          setSettings(mergedSettings);
        } catch (error) {
          console.error("Failed to parse stored settings:", error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to database and localStorage
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem("notificationSettings", JSON.stringify(settings));
        setHasChanges(false);
        setToast({ type: 'success', message: t('saveSuccess') });
      } else {
        // Still save to localStorage as fallback
        localStorage.setItem("notificationSettings", JSON.stringify(settings));
        setHasChanges(false);
        setToast({ type: 'error', message: t('saveError') });
      }
    } catch (error) {
      // Save to localStorage as fallback
      localStorage.setItem("notificationSettings", JSON.stringify(settings));
      setHasChanges(false);
      setToast({ type: 'error', message: t('profile.notifications.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  const updateChannel = (channel: keyof typeof settings.channels) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
    setHasChanges(true);
  };

  const updateType = (type: keyof typeof settings.types) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type],
      },
    }));
    setHasChanges(true);
  };

  const updateFrequency = (
    category: keyof typeof settings.frequency,
    value: typeof settings.frequency[keyof typeof settings.frequency]
  ) => {
    setSettings(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        [category]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateQuietHours = (key: keyof typeof settings.quietHours, value: any) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateEmailPreference = (pref: keyof typeof settings.emailPreferences) => {
    setSettings(prev => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [pref]: !prev.emailPreferences[pref],
      },
    }));
    setHasChanges(true);
  };

  // Show loading while checking permissions
  if (checkingPermissions) {
    return (
      <ProfileLayout pageTitle={t('title')}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <div className="text-gray-500">Checking permissions...</div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  // Don't render if not super admin (will be redirected)
  if (!isSuperAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <ProfileLayout pageTitle={t('title')}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">{t('loading')}</div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout pageTitle={t('title')}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Notification Channels */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('channels.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('channels.email.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('channels.email.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.channels.email}
                onChange={() => updateChannel("email")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('channels.inApp.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('channels.inApp.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.channels.inApp}
                onChange={() => updateChannel("inApp")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('channels.push.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('channels.push.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.channels.push}
                onChange={() => updateChannel("push")}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('types.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.systemUpdates.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.systemUpdates.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.systemUpdates}
                onChange={() => updateType("systemUpdates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.securityAlerts.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.securityAlerts.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.securityAlerts}
                onChange={() => updateType("securityAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.teamActivity.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.teamActivity.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.teamActivity}
                onChange={() => updateType("teamActivity")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.sustainabilityReports.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.sustainabilityReports.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.sustainabilityReports}
                onChange={() => updateType("sustainabilityReports")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.complianceAlerts.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.complianceAlerts.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.complianceAlerts}
                onChange={() => updateType("complianceAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('types.achievements.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('types.achievements.description')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.types.achievements}
                onChange={() => updateType("achievements")}
              />
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('frequency.title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('frequency.reports')}
              </label>
              <Select value={settings.frequency.reports} onValueChange={(value) => updateFrequency("reports", value as any)}>
                <SelectTrigger className="w-full bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05]">
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] focus:bg-gray-100 dark:focus:bg-white/[0.05]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('frequency.alerts')}
              </label>
              <Select value={settings.frequency.alerts} onValueChange={(value) => updateFrequency("alerts", value as any)}>
                <SelectTrigger className="w-full bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05]">
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] focus:bg-gray-100 dark:focus:bg-white/[0.05]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('frequency.updates')}
              </label>
              <Select value={settings.frequency.updates} onValueChange={(value) => updateFrequency("updates", value as any)}>
                <SelectTrigger className="w-full bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111111] border-gray-200 dark:border-white/[0.05]">
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] focus:bg-gray-100 dark:focus:bg-white/[0.05]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('quietHours.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('quietHours.enable')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('quietHours.enableDescription')}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.quietHours.enabled}
                onChange={() => updateQuietHours("enabled", !settings.quietHours.enabled)}
              />
            </div>

            {settings.quietHours.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('quietHours.startTime')}
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => updateQuietHours("startTime", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('quietHours.endTime')}
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => updateQuietHours("endTime", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t('quietHours.weekends')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('quietHours.weekendsDescription')}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={settings.quietHours.weekendsOff}
                    onChange={() => updateQuietHours("weekendsOff", !settings.quietHours.weekendsOff)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email Preferences */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('email.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('email.marketing.title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('email.marketing.description')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailPreferences.marketing}
                onChange={() => updateEmailPreference("marketing")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('email.productUpdates.title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('email.productUpdates.description')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailPreferences.productUpdates}
                onChange={() => updateEmailPreference("productUpdates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('email.newsletter.title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('email.newsletter.description')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailPreferences.newsletter}
                onChange={() => updateEmailPreference("newsletter")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('email.tips.title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('email.tips.description')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailPreferences.tips}
                onChange={() => updateEmailPreference("tips")}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="px-6 py-3 accent-gradient text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  {t('saving')}
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  {t('saveChanges')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 right-6 z-50"
            >
              <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
                toast.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {toast.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProfileLayout>
  );
}