"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Save, Building, Briefcase, MapPin } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  department: string;
  title: string;
  location: string;
  avatar_url: string;
  role: string;
}

interface ProfileClientProps {
  initialProfile: ProfileData;
}

export default function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(initialProfile);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        // Show success message (you could add a toast notification here)
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          avatar_url: data.data.avatar_url
        }));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      super_admin: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      platform_developer: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      account_owner: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      owner: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      sustainability_manager: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
      facility_manager: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
      analyst: "bg-blue-500 text-white",
      user: "bg-gray-500 text-white",
      viewer: "bg-gray-400 text-white"
    };

    const roleNames: Record<string, string> = {
      super_admin: "Super Admin",
      platform_developer: "Platform Developer",
      account_owner: "Account Owner",
      owner: "Account Owner",
      sustainability_manager: "Sustainability Manager",
      facility_manager: "Facility Manager",
      analyst: "Analyst",
      user: "User",
      viewer: "Viewer"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleStyles[role] || roleStyles.user}`}>
        {roleNames[role] || role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Profile Picture */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Picture
            </h2>
            {getRoleBadge(profile.role)}
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <div>
              <label className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4" />
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG, or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Engineering"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}