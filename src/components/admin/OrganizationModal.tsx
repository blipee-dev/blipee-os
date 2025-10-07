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
  Loader2,
  CreditCard,
  Palette,
  Shield,
  TrendingUp,
  Calendar,
  Image,
  Database
} from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useAuth } from "@/lib/auth/context";
import { useTranslations } from "@/providers/LanguageProvider";
import { auditLogger } from "@/lib/audit/client";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
  supabase: SupabaseClient;
}

export default function OrganizationModal({ isOpen, onClose, onSuccess, mode = 'create', data, supabase }: OrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [griSectors, setGriSectors] = useState<any[]>([]);

  // Use the app's auth context and translations
  const { user, session } = useAuth();
  const t = useTranslations('settings.organizations.modal');

  // For debugging - check if user is authenticated
  React.useEffect(() => {
    console.log('OrganizationModal - Current user from auth context:', user);
    console.log('OrganizationModal - Session from auth context:', session);
  }, [user, session]);

  // Fetch GRI sectors for dropdown
  React.useEffect(() => {
    const fetchGriSectors = async () => {
      try {
        const { data, error } = await supabase
          .from('gri_sectors')
          .select('id, code, name, published_year')
          .order('code');

        if (error) {
          console.error('Error fetching GRI sectors:', error);
          return;
        }

        setGriSectors(data || []);
        console.log('✅ Loaded GRI sectors:', data);
      } catch (error) {
        console.error('Failed to fetch GRI sectors:', error);
      }
    };

    if (isOpen) {
      fetchGriSectors();
    }
  }, [isOpen, supabase]);

  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    legal_name: "",
    slug: "",
    company_size: "11-50",
    website: "",
    logo_url: "",
    public_company: false,
    stock_ticker: "",
    
    // Contact Information
    primary_contact_email: "",
    primary_contact_phone: "",
    
    // Address Information
    headquarters_address: {
      street: "",
      city: "",
      postal_code: "",
      country: ""
    },
    billing_address: {
      street: "",
      city: "",
      postal_code: "",
      country: "",
      same_as_headquarters: true
    },
    
    // Industry & Classification
    industry_primary: "",
    industry_secondary: "",
    gri_sector_id: null,
    industry_classification_id: null,
    industry_confidence: 0,
    
    // Subscription & Billing
    subscription_tier: "enterprise" as const,
    subscription_status: "active" as const,
    subscription_seats: 10,
    subscription_started_at: "",
    subscription_expires_at: "",
    
    // System & Settings
    enabled_features: ["ai_chat", "emissions_tracking", "reporting", "analytics"],
    compliance_frameworks: ["GRI", "CDP", "TCFD", "EU_CSRD"],
    brand_colors: {
      primary: "#7c3aed",
      secondary: "#3b82f6",
      accent: "#06b6d4"
    },
    data_residency_region: "us-east-1",
    account_owner_id: null,
    metadata: {}
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        // Basic Information
        name: data.name || "",
        legal_name: data.legal_name || "",
        slug: data.slug || "",
        company_size: data.company_size || "11-50",
        website: data.website || "",
        logo_url: data.logo_url || "",
        public_company: data.public_company || false,
        stock_ticker: data.stock_ticker || "",
        
        // Contact Information
        primary_contact_email: data.primary_contact_email || "",
        primary_contact_phone: data.primary_contact_phone || "",
        
        // Address Information
        headquarters_address: data.headquarters_address || {
          street: "",
          city: "",
          postal_code: "",
          country: ""
        },
        billing_address: data.billing_address || {
          street: "",
          city: "",
          postal_code: "",
          country: "",
          same_as_headquarters: true
        },
        
        // Industry & Classification
        industry_primary: data.industry || data.industry_primary || "",
        industry_secondary: data.industry_secondary || "",
        gri_sector_id: data.gri_sector_id || null,
        industry_classification_id: data.industry_classification_id || null,
        industry_confidence: data.industry_confidence || 0,
        
        // Subscription & Billing
        subscription_tier: data.subscription_tier || "enterprise",
        subscription_status: data.subscription_status || "active",
        subscription_seats: data.subscription_seats || 10,
        subscription_started_at: data.subscription_started_at ? data.subscription_started_at.split('T')[0] : "",
        subscription_expires_at: data.subscription_expires_at ? data.subscription_expires_at.split('T')[0] : "",
        
        // System & Settings
        enabled_features: data.enabled_features || ["ai_chat", "emissions_tracking", "reporting", "analytics"],
        compliance_frameworks: data.compliance_frameworks || ["GRI", "CDP", "TCFD", "EU_CSRD"],
        brand_colors: data.brand_colors || {
          primary: "#7c3aed",
          secondary: "#3b82f6",
          accent: "#06b6d4"
        },
        data_residency_region: data.data_residency_region || "us-east-1",
        account_owner_id: data.account_owner_id || null,
        metadata: data.metadata || {}
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        // Basic Information
        name: "",
        legal_name: "",
        slug: "",
        company_size: "11-50",
        website: "",
        logo_url: "",
        public_company: false,
        stock_ticker: "",
        
        // Contact Information
        primary_contact_email: "",
        primary_contact_phone: "",
        
        // Address Information
        headquarters_address: {
          street: "",
          city: "",
          postal_code: "",
          country: ""
        },
        billing_address: {
          street: "",
          city: "",
          postal_code: "",
          country: "",
          same_as_headquarters: true
        },
        
        // Industry & Classification
        industry_primary: "",
        industry_secondary: "",
        gri_sector_id: null,
        industry_classification_id: null,
        industry_confidence: 0,
        
        // Subscription & Billing
        subscription_tier: "enterprise" as const,
        subscription_status: "active" as const,
        subscription_seats: 10,
        subscription_started_at: "",
        subscription_expires_at: "",
        
        // System & Settings
        enabled_features: ["ai_chat", "emissions_tracking", "reporting", "analytics"],
        compliance_frameworks: ["GRI", "CDP", "TCFD", "EU_CSRD"],
        brand_colors: {
          primary: "#7c3aed",
          secondary: "#3b82f6",
          accent: "#06b6d4"
        },
        data_residency_region: "us-east-1",
        account_owner_id: null,
        metadata: {}
      });
    }
  }, [data, mode]);

  // Validation function
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      errors.name = t('validation.nameRequired');
    }
    
    if (!formData.slug.trim()) {
      errors.slug = t('validation.slugRequired');
    } else if (!/^[a-z0-9\-]+$/.test(formData.slug)) {
      errors.slug = t('validation.slugInvalid');
    }
    
    // Email validation
    if (formData.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
      errors.primary_contact_email = t('validation.emailInvalid');
    }
    
    // URL validation
    if (formData.website) {
      try {
        new URL(formData.website);
      } catch {
        errors.website = t('validation.urlInvalid');
      }
    }
    
    if (formData.logo_url) {
      try {
        new URL(formData.logo_url);
      } catch {
        errors.logo_url = t('validation.urlInvalid');
      }
    }
    
    // Stock ticker validation (if public company)
    if (formData.public_company && formData.stock_ticker && !/^[A-Z]{1,5}$/.test(formData.stock_ticker)) {
      errors.stock_ticker = t('validation.stockTickerInvalid');
    }
    
    // Subscription seats validation
    if (formData.subscription_seats < 1) {
      errors.subscription_seats = t('validation.seatsMin');
    }
    
    // Industry confidence validation
    if (formData.industry_confidence < 0 || formData.industry_confidence > 100) {
      errors.industry_confidence = t('validation.confidenceRange');
    }
    
    // Color validation
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (formData.brand_colors.primary && !hexColorRegex.test(formData.brand_colors.primary)) {
      errors.brand_colors_primary = t('validation.colorInvalid');
    }
    if (formData.brand_colors.secondary && !hexColorRegex.test(formData.brand_colors.secondary)) {
      errors.brand_colors_secondary = t('validation.colorInvalid');
    }
    if (formData.brand_colors.accent && !hexColorRegex.test(formData.brand_colors.accent)) {
      errors.brand_colors_accent = t('validation.colorInvalid');
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Field error component
  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p className="mt-1 text-sm accent-text">{error}</p>
    );
  };

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
    
    // Validate form
    const validation = validateForm();
    setFieldErrors(validation.errors);
    
    if (!validation.isValid) {
      setError(t('validation.pleaseFixErrors') || 'Please fix the errors below');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Check if user is authenticated using auth context
      console.log('handleSubmit - user from context:', user);
      console.log('handleSubmit - session from context:', session);
      
      if (!user) {
        console.error('No user in auth context!');
        throw new Error("User not authenticated - please refresh and sign in again");
      }

      if (mode === 'edit' && data?.id) {
        // Update existing organization
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            name: formData.name,
            legal_name: formData.legal_name,
            slug: formData.slug,
            company_size: formData.company_size,
            website: formData.website,
            logo_url: formData.logo_url,
            public_company: formData.public_company,
            stock_ticker: formData.stock_ticker,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            headquarters_address: formData.headquarters_address,
            billing_address: formData.billing_address,
            industry_primary: formData.industry_primary,
            industry_secondary: formData.industry_secondary,
            gri_sector_id: formData.gri_sector_id,
            industry_classification_id: formData.industry_classification_id,
            industry_confidence: formData.industry_confidence,
            subscription_tier: formData.subscription_tier,
            subscription_status: formData.subscription_status,
            subscription_seats: formData.subscription_seats,
            subscription_started_at: formData.subscription_started_at ? new Date(formData.subscription_started_at).toISOString() : null,
            subscription_expires_at: formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString() : null,
            enabled_features: formData.enabled_features,
            compliance_frameworks: formData.compliance_frameworks,
            brand_colors: formData.brand_colors,
            data_residency_region: formData.data_residency_region,
            account_owner_id: formData.account_owner_id,
            metadata: formData.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (orgError) throw orgError;

        // Log the update operation
        await auditLogger.logDataOperation(
          'update',
          'organization',
          data.id,
          formData.name,
          'success',
          {
            before: data,
            after: formData
          }
        );

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
            company_size: formData.company_size,
            website: formData.website,
            logo_url: formData.logo_url,
            public_company: formData.public_company,
            stock_ticker: formData.stock_ticker,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            headquarters_address: formData.headquarters_address,
            billing_address: formData.billing_address,
            industry_primary: formData.industry_primary,
            industry_secondary: formData.industry_secondary,
            gri_sector_id: formData.gri_sector_id,
            industry_classification_id: formData.industry_classification_id,
            industry_confidence: formData.industry_confidence,
            subscription_tier: formData.subscription_tier,
            subscription_status: formData.subscription_status,
            subscription_seats: formData.subscription_seats,
            subscription_started_at: formData.subscription_started_at ? new Date(formData.subscription_started_at).toISOString() : null,
            subscription_expires_at: formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString() : null,
            enabled_features: formData.enabled_features,
            compliance_frameworks: formData.compliance_frameworks,
            brand_colors: formData.brand_colors,
            data_residency_region: formData.data_residency_region,
            account_owner_id: formData.account_owner_id,
            metadata: formData.metadata,
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

        // Log the create operation
        await auditLogger.logDataOperation(
          'create',
          'organization',
          result.data?.id || 'new',
          formData.name,
          'success',
          {
            after: formData
          }
        );
      }

      setSuccess(true);
      console.log('Organization created successfully, calling onSuccess callback');
      
      // Call onSuccess immediately to refresh the list
      if (onSuccess) {
        await onSuccess();
      }
      
      // Then close the modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("Error creating organization:", err);
      setError(err.message || "Failed to create organization");

      // Log the failed operation
      await auditLogger.logDataOperation(
        mode === 'edit' ? 'update' : 'create',
        'organization',
        data?.id || 'new',
        formData.name,
        'failure',
        {
          error: err.message
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: any; type?: string } }) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith("headquarters_address_")) {
      const field = name.replace("headquarters_address_", "");
      setFormData(prev => ({
        ...prev,
        headquarters_address: {
          ...prev.headquarters_address,
          [field]: value
        }
      }));
    } else if (name.startsWith("billing_address_")) {
      const field = name.replace("billing_address_", "");
      setFormData(prev => ({
        ...prev,
        billing_address: {
          ...prev.billing_address,
          [field]: value
        }
      }));
    } else if (name.startsWith("brand_colors_")) {
      const field = name.replace("brand_colors_", "");
      setFormData(prev => ({
        ...prev,
        brand_colors: {
          ...prev.brand_colors,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSameAsBilling = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billing_address: {
          ...prev.headquarters_address,
          same_as_headquarters: true
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        billing_address: {
          ...prev.billing_address,
          same_as_headquarters: false
        }
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
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'edit' ? t('editTitle') : mode === 'view' ? t('viewTitle') : t('createTitle')}
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
                      {mode === 'edit' ? t('updateSuccess') : t('createSuccess')}
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

              {/* AI Lookup Success Message */}
              {success && mode === 'create' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 border accent-border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 accent-text" />
                    <p className="accent-text">{t('aiLookupSuccess')}</p>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 accent-text" />
                    {t('sections.basicInfo')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.name')} *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {mode === 'create' && (
                          <button
                            type="button"
                            onClick={handleAILookup}
                            disabled={lookupLoading || !formData.name.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 accent-text hover:accent-bg-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('aiLookupTooltip')}
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
                        {t('fields.legalName')}
                      </label>
                      <input
                        type="text"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.slug')} *
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        pattern="[a-z0-9\-]+"
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.companySize')}
                      </label>
                      <CustomDropdown
                        value={formData.company_size}
                        onChange={(value) => handleChange({ target: { name: 'company_size', value } } as any)}
                        options={[
                          { value: "1-10", label: t('companySizes.1-10') },
                          { value: "11-50", label: t('companySizes.11-50') },
                          { value: "51-200", label: t('companySizes.51-200') },
                          { value: "201-500", label: t('companySizes.201-500') },
                          { value: "501-1000", label: t('companySizes.501-1000') },
                          { value: "1001-5000", label: t('companySizes.1001-5000') },
                          { value: "5000+", label: t('companySizes.5000+') }
                        ]}
                        disabled={mode === 'view'}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe className="inline w-4 h-4 mr-1" />
                        {t('fields.website')}
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Image className="inline w-4 h-4 mr-1" />
                        {t('fields.logoUrl')}
                      </label>
                      <input
                        type="url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="public_company"
                        name="public_company"
                        checked={formData.public_company}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed accent-purple-600"
                      />
                      <label htmlFor="public_company" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('fields.publicCompany')}
                      </label>
                    </div>
                    
                    {formData.public_company && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <TrendingUp className="inline w-4 h-4 mr-1" />
                          {t('fields.stockTicker')}
                        </label>
                        <input
                          type="text"
                          name="stock_ticker"
                          value={formData.stock_ticker}
                          onChange={handleChange}
                          readOnly={mode === 'view'}
                          placeholder="e.g., AAPL, MSFT"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 accent-text" />
                    {t('sections.contact')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail className="inline w-4 h-4 mr-1" />
                        {t('fields.primaryEmail')}
                      </label>
                      <input
                        type="email"
                        name="primary_contact_email"
                        value={formData.primary_contact_email}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Phone className="inline w-4 h-4 mr-1" />
                        {t('fields.primaryPhone')}
                      </label>
                      <input
                        type="tel"
                        name="primary_contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 accent-text" />
                    {t('sections.addresses')}
                  </h3>
                  
                  {/* Headquarters Address */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('fields.headquartersAddress')}</h4>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="headquarters_address_street"
                        value={formData.headquarters_address.street}
                        onChange={handleChange}
                        placeholder={t('placeholders.streetAddress')}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          name="headquarters_address_city"
                          value={formData.headquarters_address.city}
                          onChange={handleChange}
                          placeholder={t('placeholders.city')}
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        
                        <input
                          type="text"
                          name="headquarters_address_postal_code"
                          value={formData.headquarters_address.postal_code}
                          onChange={handleChange}
                          placeholder={t('placeholders.postalCode')}
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        
                        <input
                          type="text"
                          name="headquarters_address_country"
                          value={formData.headquarters_address.country}
                          onChange={handleChange}
                          placeholder={t('placeholders.country')}
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('fields.billingAddress')}</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="same_as_headquarters"
                          checked={formData.billing_address.same_as_headquarters}
                          onChange={(e) => handleSameAsBilling(e.target.checked)}
                          disabled={mode === 'view'}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed accent-purple-600"
                        />
                        <label htmlFor="same_as_headquarters" className="text-sm text-gray-600 dark:text-gray-400">
                          {t('fields.sameAsHeadquarters')}
                        </label>
                      </div>
                    </div>
                    
                    {!formData.billing_address.same_as_headquarters && (
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="billing_address_street"
                          value={formData.billing_address.street}
                          onChange={handleChange}
                          placeholder={t('placeholders.streetAddress')}
                          readOnly={mode === 'view'}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            name="billing_address_city"
                            value={formData.billing_address.city}
                            onChange={handleChange}
                            placeholder={t('placeholders.city')}
                            readOnly={mode === 'view'}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          
                          <input
                            type="text"
                            name="billing_address_postal_code"
                            value={formData.billing_address.postal_code}
                            onChange={handleChange}
                            placeholder={t('placeholders.postalCode')}
                            readOnly={mode === 'view'}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          
                          <input
                            type="text"
                            name="billing_address_country"
                            value={formData.billing_address.country}
                            onChange={handleChange}
                            placeholder={t('placeholders.country')}
                            readOnly={mode === 'view'}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Industry & Classification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 accent-text" />
                    {t('sections.industry')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.primaryIndustry')}
                      </label>
                      <input
                        type="text"
                        name="industry_primary"
                        value={formData.industry_primary}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.secondaryIndustry')}
                      </label>
                      <input
                        type="text"
                        name="industry_secondary"
                        value={formData.industry_secondary}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.griSector')}
                      </label>
                      <CustomDropdown
                        value={formData.gri_sector_id?.toString() || ''}
                        onChange={(value) => handleChange({ target: { name: 'gri_sector_id', value: value ? parseInt(value) : null } } as any)}
                        options={[
                          { value: '', label: 'No GRI Sector (Generic GRI 300 Series)' },
                          ...griSectors.map(sector => ({
                            value: sector.id.toString(),
                            label: `${sector.code}: ${sector.name} (${sector.published_year})`
                          }))
                        ]}
                        disabled={mode === 'view'}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Select your industry's GRI Sector Standard for material topic dashboards
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.industryConfidence')}
                      </label>
                      <input
                        type="number"
                        name="industry_confidence"
                        value={formData.industry_confidence}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription & Billing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 accent-text" />
                    {t('sections.subscription')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.subscriptionTier')}
                      </label>
                      <CustomDropdown
                        value={formData.subscription_tier}
                        onChange={(value) => handleChange({ target: { name: 'subscription_tier', value } } as any)}
                        options={[
                          { value: "starter", label: t('subscriptionTiers.starter') },
                          { value: "professional", label: t('subscriptionTiers.professional') },
                          { value: "enterprise", label: t('subscriptionTiers.enterprise') },
                          { value: "custom", label: t('subscriptionTiers.custom') }
                        ]}
                        disabled={mode === 'view'}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.subscriptionStatus')}
                      </label>
                      <CustomDropdown
                        value={formData.subscription_status}
                        onChange={(value) => handleChange({ target: { name: 'subscription_status', value } } as any)}
                        options={[
                          { value: "active", label: t('subscriptionStatuses.active') },
                          { value: "inactive", label: t('subscriptionStatuses.inactive') },
                          { value: "suspended", label: t('subscriptionStatuses.suspended') },
                          { value: "cancelled", label: t('subscriptionStatuses.cancelled') }
                        ]}
                        disabled={mode === 'view'}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.subscriptionSeats')}
                      </label>
                      <input
                        type="number"
                        name="subscription_seats"
                        value={formData.subscription_seats}
                        onChange={handleChange}
                        min="1"
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {t('fields.subscriptionStarted')}
                      </label>
                      <input
                        type="date"
                        name="subscription_started_at"
                        value={formData.subscription_started_at}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {t('fields.subscriptionExpires')}
                      </label>
                      <input
                        type="date"
                        name="subscription_expires_at"
                        value={formData.subscription_expires_at}
                        onChange={handleChange}
                        readOnly={mode === 'view'}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:accent-ring focus:accent-border disabled:opacity-60 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* System & Customization */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 accent-text" />
                    {t('sections.system')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Database className="inline w-4 h-4 mr-1" />
                        {t('fields.dataResidency')}
                      </label>
                      <CustomDropdown
                        value={formData.data_residency_region}
                        onChange={(value) => handleChange({ target: { name: 'data_residency_region', value } } as any)}
                        options={[
                          { value: "us-east-1", label: t('dataResidencyRegions.us-east-1') },
                          { value: "us-west-2", label: t('dataResidencyRegions.us-west-2') },
                          { value: "eu-west-1", label: t('dataResidencyRegions.eu-west-1') },
                          { value: "ap-southeast-1", label: t('dataResidencyRegions.ap-southeast-1') }
                        ]}
                        disabled={mode === 'view'}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <Palette className="inline w-4 h-4 mr-1" />
                      {t('fields.brandColors')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('fields.primaryColor')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            name="brand_colors_primary"
                            value={formData.brand_colors.primary}
                            onChange={handleChange}
                            disabled={mode === 'view'}
                            className="w-12 h-8 rounded border border-gray-200 dark:border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <input
                            type="text"
                            name="brand_colors_primary"
                            value={formData.brand_colors.primary}
                            onChange={handleChange}
                            readOnly={mode === 'view'}
                            className="flex-1 px-3 py-1 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('fields.secondaryColor')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            name="brand_colors_secondary"
                            value={formData.brand_colors.secondary}
                            onChange={handleChange}
                            disabled={mode === 'view'}
                            className="w-12 h-8 rounded border border-gray-200 dark:border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <input
                            type="text"
                            name="brand_colors_secondary"
                            value={formData.brand_colors.secondary}
                            onChange={handleChange}
                            readOnly={mode === 'view'}
                            className="flex-1 px-3 py-1 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('fields.accentColor')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            name="brand_colors_accent"
                            value={formData.brand_colors.accent}
                            onChange={handleChange}
                            disabled={mode === 'view'}
                            className="w-12 h-8 rounded border border-gray-200 dark:border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <input
                            type="text"
                            name="brand_colors_accent"
                            value={formData.brand_colors.accent}
                            onChange={handleChange}
                            readOnly={mode === 'view'}
                            className="flex-1 px-3 py-1 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
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
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success || mode === 'view'}
                    className="px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (mode === 'edit' ? t('buttons.updating') : t('buttons.creating')) : 
                     success ? (mode === 'edit' ? t('buttons.updated') : t('buttons.created')) : 
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