"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Mail,
  Shield,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Globe,
  User,
  Building
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useTranslations } from '@/providers/LanguageProvider';
import { auditLogger } from '@/lib/audit/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
  organizations?: Array<{ id: string; name: string; slug: string }>;
  supabase: SupabaseClient<Database>;
}

export default function UsersModal({ isOpen, onClose, onSuccess, mode = 'create', data, organizations = [], supabase }: UsersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const t = useTranslations('settings.users');

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer",
    organization_id: "",
    site_ids: [] as string[], // Multiple sites can be selected
    access_level: "organization" as "organization" | "site", // Organization-wide or site-specific
    status: "pending", // New users start as pending until first login
    sendInvite: true
  });

  const [availableSites, setAvailableSites] = useState<any[]>([]);

  // Load current user and all organizations
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
        }

        // Get ALL organizations (not just user's organizations)
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .order('name');

        setUserOrganizations(orgs || []);

        // Set default organization if available
        if (orgs && orgs.length > 0) {
          setFormData(prev => ({
            ...prev,
            organization_id: orgs[0].id
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, supabase]);

  // Load sites when organization changes
  useEffect(() => {
    const loadSites = async () => {
      if (!formData.organization_id) {
        setAvailableSites([]);
        return;
      }

      try {
        const { data: sites } = await supabase
          .from('sites')
          .select('id, name, location')
          .eq('organization_id', formData.organization_id)
          .order('name');

        setAvailableSites(sites || []);
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };

    loadSites();
  }, [formData.organization_id, supabase]);

  // Update form data when data prop changes
  useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "viewer",
        organization_id: data.organization_id || "",
        site_ids: data.site_ids || [],
        access_level: data.access_level || "organization",
        status: data.status || "active",
        sendInvite: false // Don't send invite when editing
      });
    } else if (mode === 'create') {
      setFormData({
        name: "",
        email: "",
        role: "viewer",
        organization_id: userOrganizations.length > 0 ? userOrganizations[0].id : "",
        site_ids: [],
        access_level: "organization",
        status: "pending", // New users start as pending until first login
        sendInvite: true
      });
    }
  }, [data, mode, userOrganizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        // Create new user via API
        const response = await fetch('/api/users/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            organization_id: formData.organization_id,
            site_ids: formData.access_level === 'site' ? formData.site_ids : [],
            access_level: formData.access_level,
            status: formData.status
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create user');
        }

        // Log audit event for user creation
        await auditLogger.logDataOperation(
          'create',
          'user',
          result.user.id,
          result.user.name,
          'success'
        );

        // TODO: Send invitation email if formData.sendInvite is true
        if (formData.sendInvite) {
          // Implement invitation logic here
          console.log('Should send invitation to:', formData.email);
        }

      } else if (mode === 'edit') {
        // Update existing user via API
        const response = await fetch('/api/users/manage', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: data.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            organization_id: formData.organization_id,
            site_ids: formData.access_level === 'site' ? formData.site_ids : [],
            access_level: formData.access_level,
            status: formData.status
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update user');
        }

        // Log audit event for user update
        await auditLogger.logDataOperation(
          'update',
          'user',
          data.id,
          formData.name,
          'success',
          {
            before: data,
            after: formData
          }
        );
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || 'An error occurred while saving the user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'create' ? t('modal.createTitle') : mode === 'edit' ? t('modal.editTitle') : t('modal.viewTitle')}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 border accent-border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 accent-text" />
                    <p className="accent-text font-medium">
                      {mode === 'edit' ? t('modal.messages.userUpdated') : t('modal.messages.userCreated')}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 accent-text" />
                    <p className="accent-text">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-8">

                {mode === 'view' ? (
                  // View mode - show detailed user information
                  <div className="space-y-8">
                    {/* User Profile Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 accent-text" />
                        {t('modal.fields.userProfile')}
                      </h3>
                      
                      <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                        <div className="w-16 h-16 accent-gradient rounded-full flex items-center justify-center">
                          <span className="text-xl font-semibold text-white">
                            {data?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {data?.name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {data?.email || 'No email provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              data?.status === 'active' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : data?.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                              {data?.status || 'Unknown'}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                              {data?.role?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'No Role'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 accent-text" />
                        {t('modal.fields.accountDetails')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('modal.organization')}
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.organizations?.name || t('modal.fields.noOrganization')}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <Calendar className="inline w-4 h-4 mr-1" />
                              {t('modal.lastLogin')}
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.last_login 
                                ? new Date(data.last_login).toLocaleString()
                                : t('modal.fields.neverLoggedIn')
                              }
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <Calendar className="inline w-4 h-4 mr-1" />
                              {t('modal.fields.memberSince') || 'Member Since'}
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.created_at 
                                ? new Date(data.created_at).toLocaleDateString()
                                : t('status.pending')
                              }
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('modal.fields.userId') || 'User ID'}
                            </label>
                            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.id || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <Calendar className="inline w-4 h-4 mr-1" />
                              {t('modal.fields.lastUpdated') || 'Last Updated'}
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.updated_at 
                                ? new Date(data.updated_at).toLocaleDateString()
                                : t('status.pending')
                              }
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('modal.fields.authUserId') || 'Auth User ID'}
                            </label>
                            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
                              {data?.auth_user_id || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit/Create mode - show form fields
                  <div className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 accent-text" />
                        {t('modal.sections.basicInfo')}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('modal.fields.name')} *
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            readOnly={mode === 'view'}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder={t('modal.placeholders.name') || "John Doe"}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Mail className="inline w-4 h-4 mr-1" />
                            {t('modal.email')} *
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            readOnly={mode === 'view' || mode === 'edit'}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder={t('modal.placeholders.email') || "john@company.com"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mode !== 'view' && (
                  <div className="space-y-8">
                    {/* Role & Organization */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 accent-text" />
                        {t('modal.sections.accessPermissions')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('modal.role')} *
                          </label>
                          <CustomDropdown
                            value={formData.role}
                            onChange={(value) => setFormData({...formData, role: value as string})}
                            options={[
                              { value: "account_owner", label: t('modal.roles.account_owner') },
                              { value: "sustainability_manager", label: t('modal.roles.sustainability_manager') },
                              { value: "facility_manager", label: t('modal.roles.facility_manager') },
                              { value: "analyst", label: t('modal.roles.analyst') },
                              { value: "viewer", label: t('modal.roles.viewer') }
                            ]}
                            disabled={mode === 'view'}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Building2 className="inline w-4 h-4 mr-1" />
                            {t('modal.organization')} *
                          </label>
                          <CustomDropdown
                            value={formData.organization_id}
                            onChange={(value) => setFormData({...formData, organization_id: value as string})}
                            options={userOrganizations.map(org => ({ value: org.id, label: org.name }))}
                            disabled={mode === 'view'}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Access Level Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          <Globe className="inline w-4 h-4 mr-1" />
                          {t('modal.accessLevel')}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                            <input
                              type="radio"
                              name="access_level"
                              value="organization"
                              checked={formData.access_level === 'organization'}
                              onChange={(e) => setFormData({...formData, access_level: 'organization' as const, site_ids: []})}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 accent-purple-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t('modal.organizationWideAccess')}
                            </span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                            <input
                              type="radio"
                              name="access_level"
                              value="site"
                              checked={formData.access_level === 'site'}
                              onChange={(e) => setFormData({...formData, access_level: 'site' as const})}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 accent-purple-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t('modal.siteSpecificAccess')}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Site Selection (only show if site-specific access is selected) */}
                      {formData.access_level === 'site' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MapPin className="inline w-4 h-4 mr-1" />
                            {t('modal.selectSites')} *
                          </label>
                          <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50 dark:bg-white/5">
                            {availableSites.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                {t('modal.noSitesAvailable')}
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {availableSites.map((site) => (
                                  <label
                                    key={site.id}
                                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                  >
                                    <input
                                      type="checkbox"
                                      value={site.id}
                                      checked={formData.site_ids.includes(site.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData({
                                            ...formData,
                                            site_ids: [...formData.site_ids, site.id]
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            site_ids: formData.site_ids.filter(id => id !== site.id)
                                          });
                                        }
                                      }}
                                      className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {site.name}
                                      </p>
                                      {site.location && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {site.location}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          {formData.access_level === 'site' && formData.site_ids.length === 0 && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {t('modal.selectAtLeastOneSite')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Account Status */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 accent-text" />
                        {t('modal.sections.accountStatus')}
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('modal.status')} *
                        </label>
                        <CustomDropdown
                          value={formData.status}
                          onChange={(value) => setFormData({...formData, status: value as string})}
                          options={[
                            { value: "pending", label: t('modal.statuses.pending') },
                            { value: "active", label: t('modal.statuses.active') },
                            { value: "inactive", label: t('modal.statuses.inactive') }
                          ]}
                          disabled={mode === 'view'}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'create' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendInvite"
                      checked={formData.sendInvite}
                      onChange={(e) => setFormData({...formData, sendInvite: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 accent-purple-600"
                    />
                    <label htmlFor="sendInvite" className="text-sm text-gray-700 dark:text-gray-300">
                      {t('modal.fields.sendInvite')}
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {t('modal.buttons.cancel')}
                  </button>
                  {mode !== 'view' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {loading ? (mode === 'edit' ? t('modal.buttons.updating') : t('modal.buttons.creating')) : 
                       mode === 'edit' ? t('modal.buttons.update') : t('modal.buttons.create')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}