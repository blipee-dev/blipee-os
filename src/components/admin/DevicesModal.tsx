"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Wifi, Zap, Thermometer } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface DevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  data?: any;
}

export default function DevicesModal({ isOpen, onClose, onSuccess, mode = 'create', data }: DevicesModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "sensor",
    site: "Headquarters",
    manufacturer: "",
    model: "",
    serialNumber: "",
    ipAddress: "",
    macAddress: "",
    protocol: "modbus",
    dataInterval: "5"
  });

  // Update form data when data prop changes
  React.useEffect(() => {
    if (data && mode === 'edit') {
      setFormData({
        name: data.name || "",
        type: data.type || "sensor",
        site: data.site || "Headquarters",
        manufacturer: data.manufacturer || "",
        model: data.model || "",
        serialNumber: data.serialNumber || "",
        ipAddress: data.ipAddress || "",
        macAddress: data.macAddress || "",
        protocol: data.protocol || "modbus",
        dataInterval: data.dataInterval || "5"
      });
    } else if (mode === 'create') {
      setFormData({
        name: "",
        type: "sensor",
        site: "Headquarters",
        manufacturer: "",
        model: "",
        serialNumber: "",
        ipAddress: "",
        macAddress: "",
        protocol: "modbus",
        dataInterval: "5"
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
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Device</h2>
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
                      Device Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Temperature Sensor Floor 1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Device Type *
                    </label>
                    <CustomDropdown
                      value={formData.type}
                      onChange={(value) => setFormData({...formData, type: value as string})}
                      options={[
                        { value: "sensor", label: "Sensor" },
                        { value: "meter", label: "Energy Meter" },
                        { value: "hvac", label: "HVAC System" },
                        { value: "lighting", label: "Lighting Control" },
                        { value: "solar", label: "Solar Panel" },
                        { value: "battery", label: "Battery Storage" },
                        { value: "other", label: "Other" }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Schneider Electric"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., PM5560"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Communication Protocol
                    </label>
                    <CustomDropdown
                      value={formData.protocol}
                      onChange={(value) => setFormData({...formData, protocol: value as string})}
                      options={[
                        { value: "modbus", label: "Modbus TCP" },
                        { value: "bacnet", label: "BACnet" },
                        { value: "mqtt", label: "MQTT" },
                        { value: "opcua", label: "OPC UA" },
                        { value: "api", label: "REST API" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Interval (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.dataInterval}
                      onChange={(e) => setFormData({...formData, dataInterval: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="5"
                    />
                  </div>
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
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
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