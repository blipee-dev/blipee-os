"use client";

import React, { useState, useEffect } from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { motion } from "framer-motion";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';
import { useTranslations } from "@/providers/LanguageProvider";
import { useLocale as useLocaleContext } from "@/contexts/LocaleContext";
import { LanguageSwitchingIndicator } from "@/components/ui/LanguageSwitchingIndicator";
import {
  Globe,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  Ruler,
  Languages,
  MapPin,
  Settings
} from "lucide-react";

interface LanguageSettings {
  displayLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
  units: string;
  contentLanguage: string;
  autoTranslate: boolean;
  autoDetectBrowser: boolean;
  rtlSupport: boolean;
  reportingStandard: string;
  exportLanguage: string;
  fallbackLanguage: string;
}

const defaultSettings: LanguageSettings = {
  displayLanguage: "en",
  timezone: "auto",
  dateFormat: "mm/dd/yyyy",
  timeFormat: "12h",
  numberFormat: "1,234.56",
  currency: "USD",
  units: "imperial",
  contentLanguage: "en",
  autoTranslate: false,
  autoDetectBrowser: true,
  rtlSupport: false,
  reportingStandard: "GRI",
  exportLanguage: "en",
  fallbackLanguage: "en"
};

const languageOptions = locales.map(locale => ({
  value: locale,
  label: `${localeFlags[locale]} ${localeNames[locale]}`
}));

const getTimezoneOptions = (t: any) => [
  { value: "auto", label: "Detect automatically" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" }
];

const dateFormatOptions = [
  { value: "mm/dd/yyyy", label: "MM/DD/YYYY (12/31/2024)" },
  { value: "dd/mm/yyyy", label: "DD/MM/YYYY (31/12/2024)" },
  { value: "yyyy-mm-dd", label: "YYYY-MM-DD (2024-12-31)" },
  { value: "dd.mm.yyyy", label: "DD.MM.YYYY (31.12.2024)" },
  { value: "mm-dd-yyyy", label: "MM-DD-YYYY (12-31-2024)" }
];

const timeFormatOptions = [
  { value: "12h", label: "12-hour (2:30 PM)" },
  { value: "24h", label: "24-hour (14:30)" }
];

const numberFormatOptions = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (EU)" },
  { value: "1 234,56", label: "1 234,56 (France)" },
  { value: "1'234.56", label: "1'234.56 (Switzerland)" }
];

const currencyOptions = [
  { value: "USD", label: "🇺🇸 US Dollar (USD)" },
  { value: "EUR", label: "🇪🇺 Euro (EUR)" },
  { value: "GBP", label: "🇬🇧 British Pound (GBP)" },
  { value: "JPY", label: "🇯🇵 Japanese Yen (JPY)" },
  { value: "CAD", label: "🇨🇦 Canadian Dollar (CAD)" },
  { value: "AUD", label: "🇦🇺 Australian Dollar (AUD)" },
  { value: "CHF", label: "🇨🇭 Swiss Franc (CHF)" },
  { value: "CNY", label: "🇨🇳 Chinese Yuan (CNY)" }
];

const unitsOptions = [
  { value: "imperial", label: "Imperial (feet, pounds, °F)" },
  { value: "metric", label: "Metric (meters, kg, °C)" }
];

const reportingStandardOptions = [
  { value: "GRI", label: "GRI Standards (English)" },
  { value: "GRI-ES", label: "GRI Standards (Spanish)" },
  { value: "GRI-FR", label: "GRI Standards (French)" },
  { value: "SASB", label: "SASB Standards" },
  { value: "TCFD", label: "TCFD Framework" },
  { value: "EU-TAXONOMY", label: "EU Taxonomy" }
];

export default function LanguagePage() {
  const t = useTranslations('profile.language');
  const { locale: currentLocale, setLocale, isLoading: localeLoading } = useLocaleContext();
  const [settings, setSettings] = useState<LanguageSettings>({
    ...defaultSettings,
    displayLanguage: currentLocale
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch from API
        const response = await fetch('/api/profile/language');
        if (response.ok) {
          const { data } = await response.json();
          setSettings(data);
        } else {
          // Fallback to localStorage if API fails
          const stored = localStorage.getItem("languageSettings");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
              // Failed to parse stored settings, use defaults
            }
          }
        }
      } catch (error) {
        // Fallback to localStorage on error
        const stored = localStorage.getItem("languageSettings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSettings(prev => ({ ...prev, ...parsed }));
          } catch (error) {
            // Failed to parse stored settings, use defaults
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/profile/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem("languageSettings", JSON.stringify(settings));
        setHasChanges(false);
        // Success feedback could be added here
      } else {
        // Still save to localStorage as fallback
        localStorage.setItem("languageSettings", JSON.stringify(settings));
        setHasChanges(false);
      }
    } catch (error) {
      // Save to localStorage as fallback
      localStorage.setItem("languageSettings", JSON.stringify(settings));
      setHasChanges(false);
    }
  };

  const updateSetting = <K extends keyof LanguageSettings>(
    key: K,
    value: LanguageSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Handle display language change immediately
    if (key === 'displayLanguage' && value !== currentLocale) {
      setLocale(value as Locale);
    }
  };

  const getPreviewText = () => {
    const now = new Date();
    const datePreview = formatDatePreview(now, settings.dateFormat);
    const timePreview = formatTimePreview(now, settings.timeFormat);
    const numberPreview = formatNumberPreview(1234.56, settings.numberFormat);
    
    return {
      date: datePreview,
      time: timePreview,
      number: numberPreview,
      currency: `${getCurrencySymbol(settings.currency)}${numberPreview}`
    };
  };

  const formatDatePreview = (date: Date, format: string) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    switch (format) {
      case "dd/mm/yyyy": return `${day}/${month}/${year}`;
      case "yyyy-mm-dd": return `${year}-${month}-${day}`;
      case "dd.mm.yyyy": return `${day}.${month}.${year}`;
      case "mm-dd-yyyy": return `${month}-${day}-${year}`;
      default: return `${month}/${day}/${year}`;
    }
  };

  const formatTimePreview = (date: Date, format: string) => {
    if (format === "24h") {
      return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
  };

  const formatNumberPreview = (num: number, format: string) => {
    switch (format) {
      case "1.234,56": return "1.234,56";
      case "1 234,56": return "1 234,56";
      case "1'234.56": return "1'234.56";
      default: return "1,234.56";
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", 
      CAD: "C$", AUD: "A$", CHF: "CHF ", CNY: "¥"
    };
    return symbols[currency] || "$";
  };

  const preview = getPreviewText();

  if (isLoading || localeLoading) {
    return (
      <ProfileLayout pageTitle="Language & Region">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout pageTitle="Language">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Language & Region</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure your language, region, and formatting preferences
          </p>
        </div>

        {/* Display Language */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 accent-text" />
            {t('displayLanguage')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Interface Language
              </label>
              <CustomDropdown
                value={settings.displayLanguage}
                onChange={(value) => updateSetting("displayLanguage", value)}
                options={languageOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('fallbackLanguage')}
              </label>
              <CustomDropdown
                value={settings.fallbackLanguage}
                onChange={(value) => updateSetting("fallbackLanguage", value)}
                options={languageOptions}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('autoDetectBrowser')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('autoDetectBrowserDescription')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.autoDetectBrowser}
                onChange={() => updateSetting("autoDetectBrowser", !settings.autoDetectBrowser)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('rtlSupport')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('rtlSupportDescription')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.rtlSupport}
                onChange={() => updateSetting("rtlSupport", !settings.rtlSupport)}
              />
            </div>
          </div>
        </div>

        {/* Regional Formats */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 accent-text" />
            {t('regionalFormats')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('dateFormat')}
              </label>
              <CustomDropdown
                value={settings.dateFormat}
                onChange={(value) => updateSetting("dateFormat", value)}
                options={dateFormatOptions}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
{t('preview')}: {preview.date}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('timeFormat')}
              </label>
              <CustomDropdown
                value={settings.timeFormat}
                onChange={(value) => updateSetting("timeFormat", value)}
                options={timeFormatOptions}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
{t('preview')}: {preview.time}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('numberFormat')}
              </label>
              <CustomDropdown
                value={settings.numberFormat}
                onChange={(value) => updateSetting("numberFormat", value)}
                options={numberFormatOptions}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
{t('preview')}: {preview.number}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('unitsOfMeasurement')}
              </label>
              <CustomDropdown
                value={settings.units}
                onChange={(value) => updateSetting("units", value)}
                options={unitsOptions}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Timezone & Currency */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 accent-text" />
            {t('timezoneAndCurrency')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('timezone')}
              </label>
              <CustomDropdown
                value={settings.timezone}
                onChange={(value) => updateSetting("timezone", value)}
                options={getTimezoneOptions(t)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('defaultCurrency')}
              </label>
              <CustomDropdown
                value={settings.currency}
                onChange={(value) => updateSetting("currency", value)}
                options={currencyOptions}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
{t('preview')}: {preview.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Content & Translation */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Languages className="w-5 h-5 accent-text" />
{t('contentAndTranslation')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
{t('contentLanguagePreference')}
              </label>
              <CustomDropdown
                value={settings.contentLanguage}
                onChange={(value) => updateSetting("contentLanguage", value)}
                options={languageOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
{t('exportLanguage')}
              </label>
              <CustomDropdown
                value={settings.exportLanguage}
                onChange={(value) => updateSetting("exportLanguage", value)}
                options={languageOptions}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('autoTranslateContent')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('autoTranslateContentDescription')}
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.autoTranslate}
              onChange={() => updateSetting("autoTranslate", !settings.autoTranslate)}
            />
          </div>
        </div>

        {/* Sustainability Standards */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 accent-text" />
{t('sustainabilityStandards')}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
{t('reportingStandardLanguage')}
            </label>
            <CustomDropdown
              value={settings.reportingStandard}
              onChange={(value) => updateSetting("reportingStandard", value)}
              options={reportingStandardOptions}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
{t('reportingStandardDescription')}
            </p>
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
              className="px-6 py-3 accent-gradient text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Save Changes
              <CheckCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Language switching indicator */}
        <LanguageSwitchingIndicator />
      </div>
    </ProfileLayout>
  );
}