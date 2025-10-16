"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Building2,
  Users,
  Layers,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Globe,
  Home,
  Calendar,
  Hash,
  Search,
  Loader2
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { SupabaseClient } from "@supabase/supabase-js";
import { useTranslations } from "@/providers/LanguageProvider";
import { auditLogger } from "@/lib/audit/client";

interface SitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
  supabase: SupabaseClient;
  organizations?: any[];
  userRole?: string;
}

export default function SitesModal({ isOpen, onClose, onSuccess, mode = 'create', data, supabase, organizations, userRole }: SitesModalProps) {
  const t = useTranslations('settings.sites.modal');
  const defaultsT = useTranslations('defaults.organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showFloorDetails, setShowFloorDetails] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    organization: defaultsT('name'),
    organization_id: "",
    address: {
      street: "",
      city: "",
      postal_code: "",
      country: defaultsT('country')
    },
    type: "office",
    total_area_sqm: "",
    total_employees: "",
    floors: "",
    timezone: defaultsT('timezone'),
    status: "active",
    floor_details: [] as Array<{ floor: number; area_sqm: number; employees: number }>,
    metadata: {} as any
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      const hasFloorDetails = data.floor_details && data.floor_details.length > 0;
      setShowFloorDetails(hasFloorDetails);
      
      setFormData({
        name: data.name || "",
        location: data.location || "",
        organization: data.organization || defaultsT('name'),
        organization_id: data.organization_id || "",
        address: data.address || {
          street: "",
          city: "",
          postal_code: "",
          country: defaultsT('country')
        },
        type: data.type || "office",
        total_area_sqm: data.total_area_sqm?.toString() || "",
        total_employees: data.total_employees?.toString() || "",
        floors: data.floors?.toString() || "",
        timezone: data.timezone || defaultsT('timezone'),
        status: data.status || "active",
        floor_details: data.floor_details || [],
        metadata: data.metadata || {}
      });
    } else if (mode === 'create') {
      setShowFloorDetails(false);
      setFormData({
        name: "",
        location: "",
        organization: defaultsT('name'),
        organization_id: organizations?.[0]?.id || "",
        address: {
          street: "",
          city: "",
          postal_code: "",
          country: defaultsT('country')
        },
        type: "office",
        total_area_sqm: "",
        total_employees: "",
        floors: "",
        timezone: defaultsT('timezone'),
        status: "active",
        floor_details: [],
        metadata: {}
      });
    }
  }, [data, mode]);

  // Add floor detail entry
  const addFloorDetail = () => {
    const newFloor = {
      floor: formData.floor_details.length + 1,
      area_sqm: 0,
      employees: 0
    };
    setFormData({
      ...formData,
      floor_details: [...formData.floor_details, newFloor]
    });
  };

  // Remove floor detail entry
  const removeFloorDetail = (index: number) => {
    setFormData({
      ...formData,
      floor_details: formData.floor_details.filter((_, i) => i !== index)
    });
  };

  // Update floor detail
  const updateFloorDetail = (index: number, field: string, value: string) => {
    const updatedDetails = [...formData.floor_details];
    updatedDetails[index] = {
      ...updatedDetails[index],
      [field]: field === 'floor' ? parseInt(value) || 0 : parseFloat(value) || 0
    };
    setFormData({
      ...formData,
      floor_details: updatedDetails
    });
  };

  // Handle postal code lookup
  const handlePostalCodeLookup = async () => {
    const postalCode = formData.address?.postal_code?.trim();
    if (!postalCode) return;

    setLookupLoading(true);
    try {
      const response = await fetch('/api/address/lookup-postal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode,
          country: formData.address?.country || 'PT'
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Update address fields with lookup data
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            city: result.data.city || prev.address.city,
            country: result.data.country || prev.address.country,
            street: result.data.street_prefix ?
              (prev.address.street?.startsWith(result.data.street_prefix) ?
                prev.address.street : result.data.street_prefix) :
              prev.address.street
          }
        }));
      }
    } catch (err) {
      console.error('Postal code lookup error:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      
      // Get current user for organization context
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Determine organization_id
      let organizationId = formData.organization_id;
      
      if (!organizationId && userRole !== 'super_admin') {
        // For non-super admins, get their first organization from organization_members
        const { data: orgMembership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (membershipError || !orgMembership) {
          throw new Error('Organization not found');
        }
        organizationId = orgMembership.organization_id;
      } else if (!organizationId) {
        throw new Error('Please select an organization');
      }

      // Build site data with only valid database columns
      const siteData: any = {
        name: formData.name,
        location: formData.location,
        organization_id: organizationId,
        type: formData.type,
        total_area_sqm: formData.total_area_sqm ? parseInt(formData.total_area_sqm) : null,
        total_employees: formData.total_employees ? parseInt(formData.total_employees) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        timezone: formData.timezone,
        status: formData.status || 'active',
        floor_details: formData.floor_details,
        address: {
          street: formData.address.street || '',
          city: formData.address.city || '',
          postal_code: formData.address.postal_code || '',
          country: formData.address.country || ''
        },
        metadata: formData.metadata || {}
      };

      // Remove the 'organization' field that doesn't exist in the database
      delete siteData.organization;

      if (mode === 'edit' && data?.id) {
        // Update existing site via API

        const response = await fetch(`/api/sites?id=${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error updating site:', errorData);
          throw new Error(errorData.error || 'Failed to update site');
        }

        const { site: updatedSite } = await response.json();

        // Log audit event for site update
        await auditLogger.logDataOperation(
          'update',
          'site',
          data.id,
          siteData.name,
          'success',
          {
            before: data,
            after: siteData
          }
        );
      } else {
        // Create new site via API
        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating site:', errorData);
          throw new Error(errorData.error || 'Failed to create site');
        }

        const { site: newSite } = await response.json();

        // Log audit event for site creation
        await auditLogger.logDataOperation(
          'create',
          'site',
          newSite.id,
          newSite.name,
          'success'
        );
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }, 1500);
      
    } catch (err: any) {
      console.error('Error submitting site:', err);
      setError(err.message || 'Failed to save site');
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
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'edit' ? t('title.edit') : mode === 'view' ? t('title.view') : t('title.add')}
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
                      {mode === 'edit' ? t('messages.updateSuccess') : t('messages.createSuccess')}
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
                {/* Organization Selection for Super Admin */}
                {userRole === 'super_admin' && organizations && organizations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 accent-text" />
                      Organization
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Organization *
                      </label>
                      <CustomDropdown
                        value={formData.organization_id}
                        onChange={(value) => setFormData({...formData, organization_id: value as string})}
                        options={organizations.map(org => ({
                          value: org.id,
                          label: org.name
                        }))}
                        className="w-full"
                        disabled={mode === 'view' || mode === 'edit'}
                      />
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Home className="w-5 h-5 accent-text" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.siteName')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={t('placeholders.siteName')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.location')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={t('placeholders.location')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.siteType')}
                      </label>
                      <CustomDropdown
                        value={formData.type}
                        onChange={(value) => setFormData({...formData, type: value as string})}
                        options={[
                          { value: "office", label: t('types.office') },
                          { value: "warehouse", label: t('types.warehouse') },
                          { value: "retail", label: t('types.retail') },
                          { value: "industrial", label: t('types.industrial') },
                          { value: "healthcare", label: t('types.healthcare') },
                          { value: "manufacturing", label: t('types.manufacturing') },
                          { value: "datacenter", label: t('types.datacenter') }
                        ]}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.totalArea')}
                      </label>
                      <input
                        type="number"
                        value={formData.total_area_sqm}
                        onChange={(e) => setFormData({...formData, total_area_sqm: e.target.value})}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={t('placeholders.totalArea')}
                      />
                    </div>
                  </div>
                </div>

                {/* Site Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 accent-text" />
                    Site Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.totalEmployees')}
                      </label>
                      <input
                        type="number"
                        value={formData.total_employees}
                        onChange={(e) => setFormData({...formData, total_employees: e.target.value})}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={t('placeholders.totalEmployees')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.numberOfFloors')}
                      </label>
                      <input
                        type="number"
                        value={formData.floors}
                        onChange={(e) => setFormData({...formData, floors: e.target.value})}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={t('placeholders.numberOfFloors')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <CustomDropdown
                        value={formData.status || 'active'}
                        onChange={(value) => setFormData({...formData, status: value as string})}
                        options={[
                          { value: "active", label: "Active" },
                          { value: "inactive", label: "Inactive" },
                          { value: "maintenance", label: "Under Maintenance" }
                        ]}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <CustomDropdown
                        value={formData.timezone}
                        onChange={(value) => setFormData({...formData, timezone: value as string})}
                        options={[
                          { value: "UTC", label: "UTC" },
                          { value: "Europe/Lisbon", label: "Europe/Lisbon" },
                          { value: "Europe/London", label: "Europe/London" },
                          { value: "Europe/Madrid", label: "Europe/Madrid" },
                          { value: "Europe/Paris", label: "Europe/Paris" },
                          { value: "Europe/Berlin", label: "Europe/Berlin" },
                          { value: "America/New_York", label: "America/New_York" },
                          { value: "America/Los_Angeles", label: "America/Los_Angeles" }
                        ]}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section - Using same pattern as Organization Modal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 accent-text" />
                    {t('sections.address') || 'Address Details'}
                  </h3>

                  <div className="space-y-4">
                    <AddressAutocomplete
                      value={formData.address?.street || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        address: {...formData.address, street: value}
                      })}
                      onSelect={(suggestion) => {
                        // Auto-fill all address fields when a suggestion is selected
                        setFormData({
                          ...formData,
                          address: {
                            street: suggestion.address || suggestion.name,
                            city: suggestion.city || formData.address.city,
                            postal_code: suggestion.postalCode || formData.address.postal_code,
                            country: suggestion.country || formData.address.country
                          }
                        });
                      }}
                      placeholder={t('placeholders.streetAddress') || 'Type address or building name...'}
                      country={formData.address?.country || 'PT'}
                      disabled={mode === 'view'}
                      label=""
                    />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="address_city"
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, city: e.target.value}
                        })}
                        placeholder={t('placeholders.city') || 'City'}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />

                      <div className="relative">
                        <input
                          type="text"
                          name="address_postal_code"
                          value={formData.address?.postal_code || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, postal_code: e.target.value}
                          })}
                          onBlur={handlePostalCodeLookup}
                          placeholder={t('placeholders.postalCode') || 'Postal Code'}
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {mode !== 'view' && (
                          <button
                            type="button"
                            onClick={handlePostalCodeLookup}
                            disabled={lookupLoading || !formData.address?.postal_code}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 accent-text hover:accent-bg-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Lookup address from postal code"
                          >
                            {lookupLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        name="address_country"
                        value={formData.address?.country || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, country: e.target.value}
                        })}
                        placeholder={t('placeholders.country') || 'Country (e.g., PT)'}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Floor Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 accent-text" />
                      {t('fields.detailedFloor')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFloorDetails(!showFloorDetails)}
                      disabled={mode === 'view'}
                      className="text-sm accent-text hover:underline"
                    >
                      {showFloorDetails ? t('fields.useOverall') : t('fields.addFloorByFloor')}
                    </button>
                  </div>
                  
                  {showFloorDetails && (
                    <div className="space-y-3">
                      {formData.floor_details.map((floor, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('fields.floor')}</label>
                              <input
                                type="number"
                                value={floor.floor}
                                onChange={(e) => updateFloorDetail(index, 'floor', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 accent-ring focus:accent-border"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('fields.area')}</label>
                              <input
                                type="number"
                                value={floor.area_sqm}
                                onChange={(e) => updateFloorDetail(index, 'area_sqm', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 accent-ring focus:accent-border"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('fields.employees')}</label>
                              <input
                                type="number"
                                value={floor.employees}
                                onChange={(e) => updateFloorDetail(index, 'employees', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 accent-ring focus:accent-border"
                              />
                            </div>
                          </div>
                          {mode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => removeFloorDetail(index)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {mode !== 'view' && (
                        <button
                          type="button"
                          onClick={addFloorDetail}
                          className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg text-gray-600 dark:text-gray-400 hover:accent-border hover:accent-text transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {t('fields.addFloor')}
                        </button>
                      )}
                    </div>
                  )}
                </div>


                {/* Form Actions */}
                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || mode === 'view'}
                    className="px-6 py-2 accent-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (mode === 'edit' ? t('buttons.updating') : t('buttons.creating')) : 
                     mode === 'edit' ? t('buttons.update') : 
                     mode === 'view' ? t('buttons.viewOnly') : 
                     t('buttons.create')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}