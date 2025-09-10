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

const themeOptions = [
  { id: "light", label: "Light", icon: Sun, description: "Bright theme for daytime use" },
  { id: "dark", label: "Dark", icon: Moon, description: "Dark theme for reduced eye strain" },
  { id: "system", label: "System", icon: Monitor, description: "Automatically match your system settings" },
];

const accentColors = [
  { id: "purple", label: "Purple", colors: "from-purple-500 to-pink-500" },
  { id: "blue", label: "Blue", colors: "from-blue-500 to-cyan-500" },
  { id: "green", label: "Green", colors: "from-green-500 to-emerald-500" },
  { id: "orange", label: "Orange", colors: "from-orange-500 to-red-500" },
  { id: "pink", label: "Pink", colors: "from-pink-500 to-rose-500" },
  { id: "indigo", label: "Indigo", colors: "from-indigo-500 to-purple-500" },
];

const fontSizes = [
  { id: "small", label: "Small", size: "14px", description: "Compact text for more content" },
  { id: "medium", label: "Medium", size: "16px", description: "Default text size" },
  { id: "large", label: "Large", size: "18px", description: "Easier to read" },
];

const densityOptions = [
  { id: "compact", label: "Compact", spacing: "Tight spacing", description: "More content visible" },
  { id: "comfortable", label: "Comfortable", spacing: "Balanced spacing", description: "Optimal readability" },
  { id: "spacious", label: "Spacious", spacing: "Relaxed spacing", description: "Maximum clarity" },
];

export default function AppearancePage() {
  const { settings, updateSetting } = useAppearance();
  const [hasChanges, setHasChanges] = useState(false);

  const handleThemeChange = (themeId: string) => {
    updateSetting('theme', themeId as "light" | "dark" | "system");
    setHasChanges(true);
  };

  const handleSettingChange = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    updateSetting(key, value);
    setHasChanges(true);
  };

  return (
    <ProfileLayout pageTitle="Appearance">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appearance</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize how blipee OS looks and feels
          </p>
        </div>

        {/* Theme Selection */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    settings.theme === theme.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${
                      settings.theme === theme.id 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-gray-600 dark:text-gray-400"
                    }`} />
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${
                        settings.theme === theme.id
                          ? "text-purple-900 dark:text-purple-200"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {theme.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {theme.description}
                      </p>
                    </div>
                    {settings.theme === theme.id && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 absolute top-4 right-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accent Color</h2>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => handleSettingChange('accentColor', color.id)}
                className={`relative w-12 h-12 rounded-lg bg-gradient-to-br ${color.colors} ${
                  settings.accentColor === color.id ? "ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-[#111111]" : ""
                }`}
                title={color.label}
              >
                {settings.accentColor === color.id && (
                  <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Font Size</h2>
          <div className="space-y-3">
            {fontSizes.map((size) => (
              <label
                key={size.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size.id}
                    checked={settings.fontSize === size.id}
                    onChange={() => handleSettingChange('fontSize', size.id as any)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Interface Density</h2>
          <div className="space-y-3">
            {densityOptions.map((density) => (
              <label
                key={density.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="density"
                    value={density.id}
                    checked={settings.density === density.id}
                    onChange={() => handleSettingChange('density', density.id as any)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accessibility</h2>
          <div className="space-y-4">
            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reduce motion</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimize animations and transitions
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('reduceMotion', !settings.reduceMotion)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reduceMotion ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
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
                  <p className="font-medium text-gray-900 dark:text-white">High contrast</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Increase color contrast for better visibility
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('highContrast', !settings.highContrast)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sidebar</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto-collapse sidebar</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically collapse sidebar on smaller screens
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('sidebarAutoCollapse', !settings.sidebarAutoCollapse)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.sidebarAutoCollapse ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.sidebarAutoCollapse ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <AccentButton size="sm">Small Button</AccentButton>
              <AccentButton size="md">Medium Button</AccentButton>
              <AccentButton size="lg">Large Button</AccentButton>
            </div>
            <div className="flex gap-3">
              <AccentButton variant="solid">Solid</AccentButton>
              <AccentButton variant="outline">Outline</AccentButton>
              <AccentButton variant="ghost">Ghost</AccentButton>
            </div>
            <div className="p-4 rounded-lg border-2 accent-border">
              <p className="accent-text font-medium">This text uses the accent color</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                The border and text will change based on your selected accent color
              </p>
            </div>
            <div className="accent-gradient p-4 rounded-lg text-white">
              <p className="font-medium">Gradient Background</p>
              <p className="text-sm opacity-90">This uses your selected accent gradient</p>
            </div>
          </div>
        </div>

        {/* Save Button - Uses Dynamic Accent Color */}
        {hasChanges && (
          <div className="flex justify-end">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AccentButton 
                onClick={() => setHasChanges(false)}
                size="md"
              >
                Settings Applied
              </AccentButton>
            </motion.div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}