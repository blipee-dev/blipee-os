"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2, Wifi, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface SitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
}

export default function SitesModal({ isOpen, onClose, onSuccess, mode = 'create', data }: SitesModalProps) {
  const [loading, setLoading] = useState(false);
  const [showFloorDetails, setShowFloorDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    organization: "PLMJ",
    address: {
      street: "",
      city: "",
      postal_code: "",
      country: "Portugal"
    },
    type: "office",
    total_area_sqm: "",
    total_employees: "",
    floors: "",
    timezone: "Europe/Lisbon",
    floor_details: [] as Array<{ floor: number; area_sqm: number; employees: number }>
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      const hasFloorDetails = data.floor_details && data.floor_details.length > 0;
      setShowFloorDetails(hasFloorDetails);
      
      setFormData({
        name: data.name || "",
        location: data.location || "",
        organization: data.organization || "PLMJ",
        address: data.address || {
          street: "",
          city: "",
          postal_code: "",
          country: "Portugal"
        },
        type: data.type || "office",
        total_area_sqm: data.total_area_sqm?.toString() || "",
        total_employees: data.total_employees?.toString() || "",
        floors: data.floors?.toString() || "",
        timezone: data.timezone || "Europe/Lisbon",
        floor_details: data.floor_details || []
      });
    } else if (mode === 'create') {
      setShowFloorDetails(false);
      setFormData({
        name: "",
        location: "",
        organization: "PLMJ",
        address: {
          street: "",
          city: "",
          postal_code: "",
          country: "Portugal"
        },
        type: "office",
        total_area_sqm: "",
        total_employees: "",
        floors: "",
        timezone: "Europe/Lisbon",
        floor_details: []
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mode === 'edit' ? 'Edit Site' : mode === 'view' ? 'View Site' : 'Add New Site'}
                    </h2>
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
                      Site Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      readOnly={mode === 'view'}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="e.g., Headquarters"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Lisbon"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Site Type
                    </label>
                    <CustomDropdown
                      value={formData.type}
                      onChange={(value) => setFormData({...formData, type: value as string})}
                      options={[
                        { value: "office", label: "Office" },
                        { value: "warehouse", label: "Warehouse" },
                        { value: "retail", label: "Retail" },
                        { value: "industrial", label: "Industrial" },
                        { value: "healthcare", label: "Healthcare" },
                        { value: "manufacturing", label: "Manufacturing" },
                        { value: "datacenter", label: "Data Center" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Area (sqm)
                    </label>
                    <input
                      type="number"
                      value={formData.total_area_sqm}
                      onChange={(e) => setFormData({...formData, total_area_sqm: e.target.value})}
                      readOnly={mode === 'view'}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Employees
                    </label>
                    <input
                      type="number"
                      value={formData.total_employees}
                      onChange={(e) => setFormData({...formData, total_employees: e.target.value})}
                      readOnly={mode === 'view'}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Floors
                    </label>
                    <input
                      type="number"
                      value={formData.floors}
                      onChange={(e) => setFormData({...formData, floors: e.target.value})}
                      readOnly={mode === 'view'}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                {/* Floor Details Section */}
                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Detailed Floor Information
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFloorDetails(!showFloorDetails)}
                      disabled={mode === 'view'}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {showFloorDetails ? 'Use Overall Values Only' : 'Add Floor-by-Floor Details'}
                    </button>
                  </div>
                  
                  {showFloorDetails && (
                    <div className="space-y-3">
                      {formData.floor_details.map((floor, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Floor</label>
                              <input
                                type="number"
                                value={floor.floor}
                                onChange={(e) => updateFloorDetail(index, 'floor', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Area (sqm)</label>
                              <input
                                type="number"
                                value={floor.area_sqm}
                                onChange={(e) => updateFloorDetail(index, 'area_sqm', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Employees</label>
                              <input
                                type="number"
                                value={floor.employees}
                                onChange={(e) => updateFloorDetail(index, 'employees', e.target.value)}
                                readOnly={mode === 'view'}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded"
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
                          Add Floor
                        </button>
                      )}
                    </div>
                  )}
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
                    disabled={loading || mode === 'view'}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
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