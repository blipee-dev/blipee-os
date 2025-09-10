"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Save, Bell, Shield, Palette, Globe, LogOut } from "lucide-react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getUserInitials, getUserDisplayName } from "@/lib/utils/user";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        router.push("/signin");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <ProfileLayout pageTitle="Profile">
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
              <div className="w-24 h-24 accent-gradient-lr rounded-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-white">
                  {getUserInitials(
                    user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name,
                    user?.email
                  )}
                </span>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                      // Handle file upload here
                      console.log('File selected:', file);
                      // You can add upload logic here
                    } else if (file) {
                      alert('File size must be less than 5MB');
                    }
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
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
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
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
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
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
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
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
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
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

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 dark:text-red-400">Sign Out</span>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </motion.button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}