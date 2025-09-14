"use client";

import React, { useState, useEffect } from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { motion } from "framer-motion";
import { 
  Sun, 
  Moon, 
  Monitor,
  Palette,
  Type,
  Layout,
  Zap,
  Eye,
  ChevronRight,
  Check
} from "lucide-react";
import { useAppearance } from "@/providers/AppearanceProvider";
import { AccentButton } from "@/components/ui/AccentButton";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const accentColors = [
  { id: "purple", gradient: "from-purple-500 to-pink-500", from: "#8b5cf6", to: "#ec4899" },
  { id: "blue", gradient: "from-blue-500 to-cyan-500", from: "#3b82f6", to: "#06b6d4" },
  { id: "green", gradient: "from-green-500 to-emerald-500", from: "#10b981", to: "#34d399" },
  { id: "orange", gradient: "from-orange-500 to-red-500", from: "#f59e0b", to: "#ef4444" },
  { id: "pink", gradient: "from-pink-500 to-rose-500", from: "#ec4899", to: "#f43f5e" },
  { id: "indigo", gradient: "from-indigo-500 to-purple-500", from: "#6366f1", to: "#8b5cf6" },
  { id: "teal", gradient: "from-teal-500 to-cyan-500", from: "#14b8a6", to: "#06b6d4" },
  { id: "sunset", gradient: "from-amber-500 to-fuchsia-500", from: "#f59e0b", to: "#d946ef" },
  { id: "slate", gradient: "from-slate-500 to-gray-500", from: "#64748b", to: "#6b7280" },
  { id: "lime", gradient: "from-lime-500 to-green-500", from: "#84cc16", to: "#22c55e" },
];

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentGradient: string;
  fontSize: 'small' | 'medium' | 'large';
  interfaceDensity: 'compact' | 'comfortable' | 'spacious';
  reduceMotion: boolean;
  highContrast: boolean;
  autoCollapseSidebar: boolean;
}

export default function AppearancePage() {
  useAuthRedirect('/profile/appearance');
  
  const t = useTranslations('profile.appearance');
  const { settings: globalSettings, updateSetting: updateGlobalSetting } = useAppearance();

  const fontSizes = [
    { id: "small", label: t('fontSize.small.title'), size: "14px", description: t('fontSize.small.description') },
    { id: "medium", label: t('fontSize.medium.title'), size: "16px", description: t('fontSize.medium.description') },
    { id: "large", label: t('fontSize.large.title'), size: "18px", description: t('fontSize.large.description') },
  ];

  const densityOptions = [
    { id: "compact", label: t('interfaceDensity.compact.title'), spacing: "Tight spacing", description: t('interfaceDensity.compact.description') },
    { id: "comfortable", label: t('interfaceDensity.comfortable.title'), spacing: "Balanced spacing", description: t('interfaceDensity.comfortable.description') },
    { id: "spacious", label: t('interfaceDensity.spacious.title'), spacing: "Relaxed spacing", description: t('interfaceDensity.spacious.description') },
  ];
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'system',
    accentGradient: 'from-purple-500 to-pink-500',
    fontSize: 'medium',
    interfaceDensity: 'comfortable',
    reduceMotion: false,
    highContrast: false,
    autoCollapseSidebar: true
  });
  // Get current accent color details
  const currentAccent = accentColors.find(c => c.gradient === settings.accentGradient) || accentColors[0];

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/profile/appearance');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSettings(data.data);
            // Sync global settings with loaded data
            updateGlobalSetting('accentGradient', data.data.accentGradient);
            updateGlobalSetting('theme', data.data.theme);
            updateGlobalSetting('fontSize', data.data.fontSize);
            updateGlobalSetting('density', data.data.interfaceDensity as any);
            updateGlobalSetting('reduceMotion', data.data.reduceMotion);
            updateGlobalSetting('highContrast', data.data.highContrast);
            updateGlobalSetting('sidebarAutoCollapse', data.data.autoCollapseSidebar);
          }
        }
      } catch (error) {
        console.log('Loading appearance settings from local storage');
        // Load from localStorage as fallback
        const stored = localStorage.getItem('appearance-settings');
        if (stored) {
          const storedSettings = JSON.parse(stored);
          setSettings(storedSettings);
          // Sync global settings with stored data
          updateGlobalSetting('accentGradient', storedSettings.accentGradient);
          updateGlobalSetting('theme', storedSettings.theme);
          updateGlobalSetting('fontSize', storedSettings.fontSize);
          updateGlobalSetting('density', storedSettings.interfaceDensity as any);
          updateGlobalSetting('reduceMotion', storedSettings.reduceMotion);
          updateGlobalSetting('highContrast', storedSettings.highContrast);
          updateGlobalSetting('sidebarAutoCollapse', storedSettings.autoCollapseSidebar);
        } else {
          // If no stored settings, use global settings as initial values
          setSettings({
            theme: globalSettings.theme,
            accentGradient: globalSettings.accentGradient,
            fontSize: globalSettings.fontSize,
            interfaceDensity: globalSettings.density as any,
            reduceMotion: globalSettings.reduceMotion,
            highContrast: globalSettings.highContrast,
            autoCollapseSidebar: globalSettings.sidebarAutoCollapse
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save settings to API and localStorage
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        localStorage.setItem('appearance-settings', JSON.stringify(settings));
        
        // Update global appearance settings
        updateGlobalSetting('accentGradient', settings.accentGradient);
        updateGlobalSetting('theme', settings.theme);
        updateGlobalSetting('fontSize', settings.fontSize);
        updateGlobalSetting('density', settings.interfaceDensity as any);
        updateGlobalSetting('reduceMotion', settings.reduceMotion);
        updateGlobalSetting('highContrast', settings.highContrast);
        updateGlobalSetting('sidebarAutoCollapse', settings.autoCollapseSidebar);
        
        setHasChanges(false);
      } else {
        // If API fails (e.g., not authenticated), still save locally
        localStorage.setItem('appearance-settings', JSON.stringify(settings));
        setHasChanges(false);
      }
    } catch (error) {
      console.log('Saving appearance settings to local storage');
      // Still save to localStorage as fallback
      localStorage.setItem('appearance-settings', JSON.stringify(settings));
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleThemeChange = (themeId: string) => {
    updateSetting('theme', themeId as "light" | "dark" | "system");
    // Apply immediately to global settings
    updateGlobalSetting('theme', themeId as "light" | "dark" | "system");
  };

  const handleSettingChange = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    updateSetting(key, value);
    
    // Apply immediately to global settings
    const globalKeyMap: Record<string, string> = {
      'fontSize': 'fontSize',
      'interfaceDensity': 'density',
      'reduceMotion': 'reduceMotion',
      'highContrast': 'highContrast',
      'autoCollapseSidebar': 'sidebarAutoCollapse'
    };
    
    const globalKey = globalKeyMap[key as string];
    if (globalKey) {
      updateGlobalSetting(globalKey as any, value as any);
    }
  };

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

        {/* Theme Selection */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('theme.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "light", icon: Sun, key: "light" },
              { id: "dark", icon: Moon, key: "dark" },
              { id: "system", icon: Monitor, key: "system" },
            ].map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative p-4 rounded-lg border transition-all ${
                    settings.theme === theme.id
                      ? "shadow-lg dark:shadow-xl"
                      : "border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]"
                  }`}
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: settings.theme === theme.id ? currentAccent.from : undefined
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${
                      settings.theme === theme.id 
                        ? ""
                        : "text-gray-600 dark:text-gray-400"
                    }`} 
                    style={{
                      color: settings.theme === theme.id ? currentAccent.from : undefined
                    }}/>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t(`theme.${theme.key}.title`)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t(`theme.${theme.key}.description`)}
                      </p>
                    </div>
                    {settings.theme === theme.id && (
                      <Check className={`w-4 h-4 absolute top-4 right-4`} 
                        style={{
                          background: `linear-gradient(135deg, ${currentAccent.from}, ${currentAccent.to})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('accentColor.title')}</h2>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => {
                  setSettings(prev => ({ 
                    ...prev, 
                    accentGradient: color.gradient
                  }));
                  setHasChanges(true);
                  // Apply immediately to global settings
                  updateGlobalSetting('accentGradient', color.gradient);
                }}
                className={`relative w-12 h-12 rounded-lg bg-gradient-to-br ${color.gradient} ${
                  settings.accentGradient === color.gradient ? "ring-2 ring-offset-2 dark:ring-offset-[#111111]" : ""
                }`}
                style={{
                  '--tw-ring-color': settings.accentGradient === color.gradient ? color.from : undefined
                } as React.CSSProperties}
                title={t(`accentColors.${color.id}`)}
              >
                {settings.accentGradient === color.gradient && (
                  <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('fontSize.title')}</h2>
          <div className="space-y-3">
            {fontSizes.map((size) => (
              <label
                key={size.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size.id}
                    checked={settings.fontSize === size.id}
                    onChange={() => handleSettingChange('fontSize', size.id as any)}
                    className="w-4 h-4 focus:ring-2"
                    style={{
                      accentColor: currentAccent.from
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white" style={{ fontSize: size.size }}>
                      {size.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {size.description}
                    </p>
                  </div>
                </div>
                <Type className="w-4 h-4 text-gray-400" style={{ fontSize: size.size }} />
              </label>
            ))}
          </div>
        </div>

        {/* Interface Density */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('interfaceDensity.title')}</h2>
          <div className="space-y-3">
            {densityOptions.map((density) => (
              <label
                key={density.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="density"
                    value={density.id}
                    checked={settings.interfaceDensity === density.id}
                    onChange={() => handleSettingChange('interfaceDensity', density.id as any)}
                    className="w-4 h-4 focus:ring-2"
                    style={{
                      accentColor: currentAccent.from
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {density.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {density.description}
                    </p>
                  </div>
                </div>
                <Layout className="w-4 h-4 text-gray-400" />
              </label>
            ))}
          </div>
        </div>

        {/* Accessibility Options */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('accessibility.title')}</h2>
          <div className="space-y-4">
            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('accessibility.reduceMotion.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('accessibility.reduceMotion.description')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('reduceMotion', !settings.reduceMotion)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reduceMotion 
                    ? "bg-gradient-to-r " + currentAccent.gradient
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reduceMotion ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('accessibility.highContrast.title')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('accessibility.highContrast.description')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('highContrast', !settings.highContrast)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast 
                    ? "bg-gradient-to-r " + currentAccent.gradient
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Behavior */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('sidebar.title')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('sidebar.autoCollapse.title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('sidebar.autoCollapse.description')}
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('autoCollapseSidebar', !settings.autoCollapseSidebar)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoCollapseSidebar 
                  ? "bg-gradient-to-r " + currentAccent.gradient
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoCollapseSidebar ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('preview.title')}</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button className={`px-3 py-1.5 text-sm text-white rounded-lg font-medium transition-all hover:opacity-90 bg-gradient-to-r ${currentAccent.gradient}`}>
                {t('preview.smallButton')}
              </button>
              <button className={`px-4 py-2 text-white rounded-lg font-medium transition-all hover:opacity-90 bg-gradient-to-r ${currentAccent.gradient}`}>
                {t('preview.mediumButton')}
              </button>
              <button className={`px-6 py-3 text-lg text-white rounded-lg font-medium transition-all hover:opacity-90 bg-gradient-to-r ${currentAccent.gradient}`}>
                {t('preview.largeButton')}
              </button>
            </div>
            <div className="flex gap-3">
              <button className={`px-4 py-2 text-white rounded-lg font-medium transition-all hover:opacity-90 bg-gradient-to-r ${currentAccent.gradient}`}>
                {t('preview.solid')}
              </button>
              <div className={`relative inline-block p-[2px] rounded-lg bg-gradient-to-r ${currentAccent.gradient}`}>
                <button 
                  className="px-4 py-2 bg-white dark:bg-[#111111] rounded-[6px] font-medium transition-all hover:bg-transparent hover:text-white"
                  style={{ color: currentAccent.from }}>
                  {t('preview.outline')}
                </button>
              </div>
              <button 
                className="px-4 py-2 rounded-lg font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                style={{
                  color: currentAccent.from
                }}>
                {t('preview.ghost')}
              </button>
            </div>
            <div className={`relative p-[2px] rounded-lg bg-gradient-to-r ${currentAccent.gradient}`}>
              <div className="bg-white dark:bg-[#111111] p-4 rounded-[6px]">
                <p className="font-medium text-transparent bg-clip-text"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${currentAccent.from}, ${currentAccent.to})`,
                  }}>
                  {t('preview.accentText')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('preview.borderText')}
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-lg text-white bg-gradient-to-r ${currentAccent.gradient}`}>
              <p className="font-medium">{t('preview.gradientBackground')}</p>
              <p className="text-sm opacity-90">{t('preview.gradientText')}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className={`px-6 py-2 disabled:opacity-50 text-white rounded-lg font-medium transition-all hover:opacity-90 bg-gradient-to-r ${currentAccent.gradient}`}
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}