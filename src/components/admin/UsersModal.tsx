"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Shield, Building2 } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
}

export default function UsersModal({ isOpen, onClose, onSuccess, mode = 'create', data }: UsersModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    organization: "PLMJ",
    department: "",
    phone: "",
    sendInvite: true
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        role: data.role?.toLowerCase() || "user",
        organization: data.organization || "PLMJ",
        department: data.department || "",
        phone: data.phone || "",
        sendInvite: false // Don't send invite when editing
      });
    } else if (mode === 'create') {
      setFormData({
        name: "",
        email: "",
        role: "user",
        organization: "PLMJ",
        department: "",
        phone: "",
        sendInvite: true
      });
    }
  }, [data, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSuccess?.();
      onClose();
    }, 1500);
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
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="João Silva"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="joao@plmj.com"
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
                      options={[
                        { value: "user", label: "User" },
                        { value: "manager", label: "Manager" },
                        { value: "admin", label: "Admin" },
                        { value: "viewer", label: "Viewer" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Legal, Finance"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={formData.sendInvite}
                    onChange={(e) => setFormData({...formData, sendInvite: e.target.checked})}
                    className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                  />
                  <label htmlFor="sendInvite" className="text-sm text-gray-700 dark:text-gray-300">
                    Send invitation email to user
                  </label>
                </div>

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
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : 
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