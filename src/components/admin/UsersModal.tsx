"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Shield, Building2 } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { createClient } from '@/lib/supabase/client';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
  organizations?: Array<{ id: string; name: string; slug: string }>;
}

export default function UsersModal({ isOpen, onClose, onSuccess, mode = 'create', data, organizations = [] }: UsersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer",
    organization_id: "",
    department: "",
    phone: "",
    title: "",
    location: "",
    status: "active",
    sendInvite: true
  });

  // Load current user and organizations
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          
          // Get user's organizations
          const { data: userOrgs } = await supabase
            .from('user_organizations')
            .select(`
              organization_id,
              organizations (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', user.id);

          setUserOrganizations(userOrgs?.map(uo => uo.organizations) || []);
          
          // Set default organization if available
          if (userOrgs && userOrgs.length > 0) {
            setFormData(prev => ({
              ...prev,
              organization_id: userOrgs[0].organization_id
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen, supabase]);

  // Update form data when data prop changes
  useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "viewer",
        organization_id: data.organization_id || "",
        department: data.department || "",
        phone: data.phone || "",
        title: data.title || "",
        location: data.location || "",
        status: data.status || "active",
        sendInvite: false // Don't send invite when editing
      });
    } else if (mode === 'create') {
      setFormData({
        name: "",
        email: "",
        role: "viewer",
        organization_id: userOrganizations.length > 0 ? userOrganizations[0].id : "",
        department: "",
        phone: "",
        title: "",
        location: "",
        status: "active",
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
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('app_users')
          .insert([{
            name: formData.name,
            email: formData.email,
            role: formData.role,
            organization_id: formData.organization_id,
            department: formData.department,
            phone: formData.phone,
            title: formData.title,
            location: formData.location,
            status: formData.status,
            created_by: currentUser?.id
          }])
          .select()
          .single();

        if (createError) throw createError;

        // TODO: Send invitation email if formData.sendInvite is true
        if (formData.sendInvite) {
          // Implement invitation logic here
          console.log('Should send invitation to:', formData.email);
        }

      } else if (mode === 'edit') {
        // Update existing user
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            organization_id: formData.organization_id,
            department: formData.department,
            phone: formData.phone,
            title: formData.title,
            location: formData.location,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) throw updateError;
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
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-2xl shadow-2xl">
              <div className="sticky top-0 z-10 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'create' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'View User'}
                    </h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={mode === 'view'}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={mode === 'view'}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role *
                    </label>
                    <CustomDropdown
                      value={formData.role}
                      onChange={(value) => setFormData({...formData, role: value as string})}
                      disabled={mode === 'view'}
                      options={[
                        { value: "account_owner", label: "Account Owner" },
                        { value: "sustainability_manager", label: "Sustainability Manager" },
                        { value: "facility_manager", label: "Facility Manager" },
                        { value: "analyst", label: "Analyst" },
                        { value: "viewer", label: "Viewer" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization *
                    </label>
                    <CustomDropdown
                      value={formData.organization_id}
                      onChange={(value) => setFormData({...formData, organization_id: value as string})}
                      disabled={mode === 'view'}
                      options={userOrganizations.map(org => ({ value: org.id, label: org.name }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      disabled={mode === 'view'}
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Sustainability, Operations"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      disabled={mode === 'view'}
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Sustainability Analyst"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      disabled={mode === 'view'}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-[#616161] dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <CustomDropdown
                      value={formData.status}
                      onChange={(value) => setFormData({...formData, status: value as string})}
                      disabled={mode === 'view'}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                        { value: "pending", label: "Pending" }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                {mode === 'create' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendInvite"
                      checked={formData.sendInvite}
                      onChange={(e) => setFormData({...formData, sendInvite: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500 checked:border-transparent focus:ring-2 accent-ring"
                    />
                    <label htmlFor="sendInvite" className="text-sm text-gray-700 dark:text-gray-300">
                      Send invitation email to user
                    </label>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/[0.05]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  {mode !== 'view' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 accent-gradient-lr text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : 
                       mode === 'edit' ? "Update User" : "Create User"}
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