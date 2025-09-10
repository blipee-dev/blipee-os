"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Save, Bell, Shield, Palette, Globe, LogOut } from "lucide-react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getUserInitials, getUserDisplayName } from "@/lib/utils/user";
import { useTranslations } from "next-intl";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('profile');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch profile data on mount, but only if user is authenticated
  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else if (user === null) {
      // Only redirect if we're certain there's no user (not just undefined/loading)
      router.push('/signin');
    }
    // If user is undefined, it's still loading, so we wait
  }, [user, router]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProfileData({
            name: data.data.full_name || '',
            email: data.data.email || user?.email || '',
            phone: data.data.phone || '',
            bio: data.data.metadata?.bio || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use auth user data as fallback
      setProfileData({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        bio: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        // Show success message (could add a toast here)
        console.log('Profile saved successfully');
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

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

  // Show loading while auth is being determined or profile is being fetched
  if (loading || user === undefined) {
    return (
      <ProfileLayout pageTitle={t('title')}>
        <div className="p-6 bg-white dark:bg-[#212121] min-h-screen">
          <div className="max-w-3xl mx-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {user === undefined ? 'Checking authentication...' : 'Loading profile...'}
              </p>
            </div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  // If no user and not loading, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <ProfileLayout pageTitle={t('title')}>
      <div className="p-6 bg-white dark:bg-[#212121] min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header - Hidden on mobile */}
          <div className="mb-8 hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-[#616161] dark:text-[#757575]">
              {t('subtitle')}
            </p>
          </div>

          {/* Profile Picture Section */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('sections.profilePicture.title')}
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
                      alert(t('sections.profilePicture.uploadError'));
                    }
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {t('sections.profilePicture.changePhoto')}
                </button>
                <p className="text-xs text-[#616161] dark:text-[#757575] mt-2">
                  {t('sections.profilePicture.fileHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('sections.personalInformation.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  {t('sections.personalInformation.fullName')}
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('sections.personalInformation.placeholders.fullName')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  {t('sections.personalInformation.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('sections.personalInformation.placeholders.emailAddress')}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  {t('sections.personalInformation.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('sections.personalInformation.placeholders.phoneNumber')}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#616161] dark:text-[#757575] mb-2">
                  {t('sections.personalInformation.bio')}
                </label>
                <textarea
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('sections.personalInformation.placeholders.bio')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:accent-ring"
                />
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('sections.quickSettings.title')}
            </h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">{t('sections.quickSettings.notifications.title')}</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">{t('sections.quickSettings.notifications.action')}</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">{t('sections.quickSettings.security.title')}</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">{t('sections.quickSettings.security.action')}</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">{t('sections.quickSettings.appearance.title')}</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">{t('sections.quickSettings.appearance.status')}</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  <span className="text-gray-900 dark:text-white">{t('sections.quickSettings.language.title')}</span>
                </div>
                <span className="text-sm text-[#616161] dark:text-[#757575]">{t('sections.quickSettings.language.status')}</span>
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 dark:text-red-400">{t('sections.quickSettings.signOut.title')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <motion.button
              onClick={handleSaveProfile}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className={`px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4" />
              {saving ? t('sections.actions.saving') : t('sections.actions.saveChanges')}
            </motion.button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}