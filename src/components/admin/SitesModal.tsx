"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2, Wifi, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { SupabaseClient } from "@supabase/supabase-js";
import { useTranslations } from "@/providers/LanguageProvider";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting site data:', formData);
      
      // Get current user for organization context
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Determine organization_id
      let organizationId = formData.organization_id;
      
      if (!organizationId && userRole !== 'super_admin') {
        // For non-super admins, get their organization
        const { data: userOrgs, error: orgError } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (orgError || !userOrgs) {
          throw new Error('Organization not found');
        }
        organizationId = userOrgs.organization_id;
      } else if (!organizationId) {
        throw new Error('Please select an organization');
      }

      const siteData = {
        ...formData,
        organization_id: organizationId,
        address: {
          street: formData.address.street || '',
          city: formData.address.city || '',
          postal_code: formData.address.postal_code || '',
          country: formData.address.country || ''
        },
        metadata: formData.metadata || {},
        status: 'active'
      };

      if (mode === 'edit' && data?.id) {
        // Update existing site
        const { error: updateError } = await supabase
          .from('sites')
          .update(siteData)
          .eq('id', data.id);

        if (updateError) {
          console.error('Error updating site:', updateError);
          throw new Error(updateError.message);
        }
        console.log('Site updated successfully');
      } else {
        // Create new site
        const { data: newSite, error: createError } = await supabase
          .from('sites')
          .insert(siteData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating site:', createError);
          throw new Error(createError.message);
        }
        console.log('Site created successfully:', newSite);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
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
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
              <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'edit' ? t('title.edit') : mode === 'view' ? t('title.view') : t('title.add')}
                    </h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Organization Selection for Super Admin */}
                {userRole === 'super_admin' && organizations && organizations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization *
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
                )}

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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t('placeholders.totalArea')}
                    />
                  </div>
                </div>

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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t('placeholders.numberOfFloors')}
                    />
                  </div>
                </div>

                {/* Floor Details Section */}
                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('fields.detailedFloor')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFloorDetails(!showFloorDetails)}
                      disabled={mode === 'view'}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('fields.area')}</label>
                              <input
                                type="number"
                                value={floor.area_sqm}
                                onChange={(e) => updateFloorDetail(index, 'area_sqm', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('fields.employees')}</label>
                              <input
                                type="number"
                                value={floor.employees}
                                onChange={(e) => updateFloorDetail(index, 'employees', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                          className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {t('fields.addFloor')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">{mode === 'edit' ? t('messages.updateSuccess') : t('messages.createSuccess')}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/10">
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
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
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