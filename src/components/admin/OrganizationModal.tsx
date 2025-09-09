"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Building2, 
  Globe, 
  Users, 
  Mail, 
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
}

export default function OrganizationModal({ isOpen, onClose, onSuccess, mode = 'create', data }: OrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const supabase = createClient();
  
  // For debugging - check if user is authenticated
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
    };
    checkAuth();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    slug: "",
    industry_primary: "",
    industry_secondary: "",
    company_size: "11-50",
    website: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    headquarters_address: {
      street: "",
      city: "",
      postal_code: "",
      country: ""
    },
    subscription_tier: "enterprise" as const,
    subscription_status: "active" as const,
    enabled_features: ["ai_chat", "emissions_tracking", "reporting", "analytics"],
    compliance_frameworks: ["GRI", "CDP", "TCFD", "EU_CSRD"]
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        name: data.name || "",
        legal_name: data.legal_name || "",
        slug: data.slug || "",
        industry_primary: data.industry || data.industry_primary || "",
        industry_secondary: data.industry_secondary || "",
        company_size: data.company_size || "11-50",
        website: data.website || "",
        primary_contact_email: data.primary_contact_email || "",
        primary_contact_phone: data.primary_contact_phone || "",
        headquarters_address: data.headquarters_address || {
          street: "",
          city: "",
          postal_code: "",
          country: ""
        },
        subscription_tier: data.subscription_tier || "enterprise",
        subscription_status: data.subscription_status || "active",
        enabled_features: data.enabled_features || ["ai_chat", "emissions_tracking", "reporting", "analytics"],
        compliance_frameworks: data.compliance_frameworks || ["GRI", "CDP", "TCFD", "EU_CSRD"]
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: "",
        legal_name: "",
        slug: "",
        industry_primary: "",
        industry_secondary: "",
        company_size: "11-50",
        website: "",
        primary_contact_email: "",
        primary_contact_phone: "",
        headquarters_address: {
          street: "",
          city: "",
          postal_code: "",
          country: ""
        },
        subscription_tier: "enterprise" as const,
        subscription_status: "active" as const,
        enabled_features: ["ai_chat", "emissions_tracking", "reporting", "analytics"],
        compliance_frameworks: ["GRI", "CDP", "TCFD", "EU_CSRD"]
      });
    }
  }, [data, mode]);

  const handleAILookup = async () => {
    if (!formData.name.trim()) {
      setError("Please enter an organization name first");
      return;
    }

    setLookupLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/lookup-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationName: formData.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to lookup organization');
      }

      const orgData = await response.json();

      // Handle headquarters address
      let headquartersAddress = {
        street: "",
        city: "",
        postal_code: "",
        country: ""
      };

      if (orgData.headquarters_address) {
        if (typeof orgData.headquarters_address === 'object') {
          headquartersAddress = {
            street: orgData.headquarters_address.street || "",
            city: orgData.headquarters_address.city || "",
            postal_code: orgData.headquarters_address.postal_code || "",
            country: orgData.headquarters_address.country || ""
          };
        } else if (typeof orgData.headquarters_address === 'string') {
          // Fallback: Parse address string into components
          const addressParts = orgData.headquarters_address.split(',').map(s => s.trim());
          if (addressParts.length >= 4) {
            headquartersAddress = {
              street: addressParts[0] || "",
              city: addressParts[1] || "",
              postal_code: addressParts[2] || "",
              country: addressParts[3] || ""
            };
          }
        }
      }

      // Update form with AI-fetched data
      setFormData(prev => ({
        ...prev,
        name: orgData.name || prev.name,
        legal_name: orgData.legal_name || prev.legal_name,
        slug: orgData.slug || prev.slug,
        industry_primary: orgData.industry_primary || prev.industry_primary,
        industry_secondary: orgData.industry_secondary || prev.industry_secondary,
        company_size: orgData.company_size || prev.company_size,
        website: orgData.website || prev.website,
        primary_contact_email: orgData.primary_contact_email || prev.primary_contact_email,
        primary_contact_phone: orgData.primary_contact_phone || prev.primary_contact_phone,
        headquarters_address: headquartersAddress
      }));

      // Show success message using the existing success state
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('AI Lookup error:', err);
      setError('Failed to lookup organization. Please try again or enter details manually.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;
    
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (mode === 'edit' && data?.id) {
        // Update existing organization
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            name: formData.name,
            legal_name: formData.legal_name,
            slug: formData.slug,
            industry_primary: formData.industry_primary,
            industry_secondary: formData.industry_secondary,
            company_size: formData.company_size,
            website: formData.website,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            headquarters_address: formData.headquarters_address,
            subscription_tier: formData.subscription_tier,
            subscription_status: formData.subscription_status,
            enabled_features: formData.enabled_features,
            compliance_frameworks: formData.compliance_frameworks,
          })
          .eq('id', data.id);

        if (orgError) throw orgError;
        
      } else {
        // Create new organization via API to handle RLS properly
        const response = await fetch('/api/organizations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            legal_name: formData.legal_name,
            slug: formData.slug,
            industry_primary: formData.industry_primary,
            industry_secondary: formData.industry_secondary,
            company_size: formData.company_size,
            website: formData.website,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            headquarters_address: formData.headquarters_address,
            subscription_tier: formData.subscription_tier,
            subscription_status: formData.subscription_status,
            enabled_features: formData.enabled_features,
            compliance_frameworks: formData.compliance_frameworks,
            settings: {
              ai_enabled: true,
              auto_tracking: true,
              reporting_frequency: "monthly"
            }
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create organization');
        }
      }

      setSuccess(true);
      console.log('Organization created successfully, calling onSuccess callback');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Error creating organization:", err);
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address_")) {
      const field = name.replace("address_", "");
      setFormData(prev => ({
        ...prev,
        headquarters_address: {
          ...prev.headquarters_address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'edit' ? 'Edit Organization' : mode === 'view' ? 'View Organization' : 'Add New Organization'}
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
                  className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      Organization {mode === 'edit' ? 'updated' : 'created'} successfully!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* AI Lookup Success Message */}
              {success && mode === 'create' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-green-800 dark:text-green-300">✨ Organization details filled by AI!</p>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {mode === 'create' && (
                          <button
                            type="button"
                            onClick={handleAILookup}
                            disabled={lookupLoading || !formData.name.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="AI Lookup - Auto-fill organization details"
                          >
                            {lookupLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        pattern="[a-z0-9\-]+"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Size
                      </label>
                      <select
                        name="company_size"
                        value={formData.company_size}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1001-5000">1001-5000 employees</option>
                        <option value="5000+">5000+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Industry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-500" />
                    Industry
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Industry
                      </label>
                      <input
                        type="text"
                        name="industry_primary"
                        value={formData.industry_primary}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secondary Industry
                      </label>
                      <input
                        type="text"
                        name="industry_secondary"
                        value={formData.industry_secondary}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Primary Email
                      </label>
                      <input
                        type="email"
                        name="primary_contact_email"
                        value={formData.primary_contact_email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Phone className="inline w-4 h-4 mr-1" />
                        Primary Phone
                      </label>
                      <input
                        type="tel"
                        name="primary_contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="inline w-4 h-4 mr-1" />
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Headquarters Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    Headquarters Address
                  </h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="address_street"
                      value={formData.headquarters_address.street}
                      onChange={handleChange}
                      placeholder="Street Address"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="address_city"
                        value={formData.headquarters_address.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      
                      <input
                        type="text"
                        name="address_postal_code"
                        value={formData.headquarters_address.postal_code}
                        onChange={handleChange}
                        placeholder="Postal Code"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      
                      <input
                        type="text"
                        name="address_country"
                        value={formData.headquarters_address.country}
                        onChange={handleChange}
                        placeholder="Country"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success || mode === 'view'}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : 
                     success ? (mode === 'edit' ? "Updated!" : "Created!") : 
                     mode === 'edit' ? "Update" : 
                     mode === 'view' ? "View Only" : 
                     "Create"}
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