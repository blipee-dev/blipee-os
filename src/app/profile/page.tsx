"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Save, Bell, Shield, Palette, Globe } from "lucide-react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <AppLayout
      conversations={[]}
      onNewConversation={() => router.push("/blipee-ai")}
      onSelectConversation={(id) => console.log("Select conversation", id)}
      onDeleteConversation={(id) => console.log("Delete conversation", id)}
      showSidebar={false}
      pageTitle="Profile"
    >
      <div className="p-6 bg-white dark:bg-[#212121] min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header - Hidden on mobile */}
          <div className="mb-8 hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Profile
            </h1>
            <p className="text-[#616161] dark:text-[#757575]">
              Manage your personal information and preferences
            </p>
          </div>

          {/* Profile Picture Section */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile Picture
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Change Photo
                </button>
                <p className="text-xs text-[#616161] dark:text-[#757575] mt-2">
                  JPG, PNG, or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Settings
            </h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">Notifications</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">Manage</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">Security</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">Configure</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">Appearance</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">Dark</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">Language</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">English</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </motion.button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}