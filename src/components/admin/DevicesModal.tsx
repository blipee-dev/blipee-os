"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Wifi, Settings, MapPin, AlertCircle, Check } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from '@/providers/LanguageProvider';

interface DevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'view';
  device?: any;
  sites: any[];
  organizations: any[];
}

export default function DevicesModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'create', 
  device,
  sites,
  organizations 
}: DevicesModalProps) {
  const t = useTranslations('settings.devices.modal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "sensor",
    site_id: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    ip_address: "",
    mac_address: "",
    protocol: "modbus",
    data_interval: 5,
    floor: null as number | null,
    zone: "",
    status: "offline"
  });

  const supabase = useMemo(() => createClient(), []);

  // Update form data when device prop changes
  useEffect(() => {
    if (device && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: device.name || "",
        type: device.type || "sensor",
        site_id: device.site_id || "",
        manufacturer: device.manufacturer || "",
        model: device.model || "",
        serial_number: device.serial_number || "",
        ip_address: device.ip_address || "",
        mac_address: device.mac_address || "",
        protocol: device.protocol || "modbus",
        data_interval: device.data_interval || 5,
        floor: device.floor || null,
        zone: device.zone || "",
        status: device.status || "offline"
      });
    } else if (mode === 'create') {
      // Set default site if available
      const defaultSiteId = sites?.[0]?.id || "";
      setFormData({
        name: "",
        type: "sensor",
        site_id: defaultSiteId,
        manufacturer: "",
        model: "",
        serial_number: "",
        ip_address: "",
        mac_address: "",
        protocol: "modbus",
        data_interval: 5,
        floor: null,
        zone: "",
        status: "offline"
      });
    }
  }, [device, mode, sites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;
    
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'create') {
        const { error } = await supabase
          .from('devices')
          .insert({
            ...formData,
            floor: formData.floor || null
          });

        if (error) throw error;
        
        setMessage({ type: 'success', text: t('messages.createSuccess') });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else if (mode === 'edit' && device) {
        const { error } = await supabase
          .from('devices')
          .update({
            ...formData,
            floor: formData.floor || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', device.id);

        if (error) throw error;
        
        setMessage({ type: 'success', text: t('messages.updateSuccess') });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving device:', error);
      setMessage({ 
        type: 'error', 
        text: mode === 'create' ? t('messages.createError') : t('messages.updateError')
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit': return t('editTitle');
      case 'view': return t('viewTitle');
      default: return t('addTitle');
    }
  };

  const tTypes = useTranslations('settings.devices.types');
  const deviceTypes = [
    { value: "sensor", label: tTypes('sensor') },
    { value: "meter", label: tTypes('meter') },
    { value: "hvac", label: tTypes('hvac') },
    { value: "lighting", label: tTypes('lighting') },
    { value: "solar", label: tTypes('solar') },
    { value: "battery", label: tTypes('battery') },
    { value: "other", label: tTypes('other') }
  ];

  const tProtocols = useTranslations('settings.devices.protocols');
  const protocols = [
    { value: "modbus", label: tProtocols('modbus') },
    { value: "bacnet", label: tProtocols('bacnet') },
    { value: "mqtt", label: tProtocols('mqtt') },
    { value: "opcua", label: tProtocols('opcua') },
    { value: "api", label: tProtocols('api') }
  ];

  const siteOptions = sites.map(site => ({
    value: site.id,
    label: site.name
  }));

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
              <div className="sticky top-0 z-10 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getModalTitle()}</h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                }`}>
                  {message.type === 'success' ? (
                    <Check className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sections.basicInfo')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.name')} *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={mode === 'view'}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.namePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.type')} *
                      </label>
                      <CustomDropdown
                        value={formData.type}
                        onChange={(value) => setFormData({...formData, type: value as string})}
                        options={deviceTypes}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.site')} *
                      </label>
                      <CustomDropdown
                        value={formData.site_id}
                        onChange={(value) => setFormData({...formData, site_id: value as string})}
                        options={siteOptions}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.serialNumber')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.serialNumberPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Connectivity Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Wifi className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sections.connectivity')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.ipAddress')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.ip_address}
                        onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.ipAddressPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.macAddress')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.mac_address}
                        onChange={(e) => setFormData({...formData, mac_address: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.macAddressPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.protocol')}
                      </label>
                      <CustomDropdown
                        value={formData.protocol}
                        onChange={(value) => setFormData({...formData, protocol: value as string})}
                        options={protocols}
                        className="w-full"
                        disabled={mode === 'view'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.dataInterval')}
                      </label>
                      <input
                        type="number"
                        disabled={mode === 'view'}
                        value={formData.data_interval}
                        onChange={(e) => setFormData({...formData, data_interval: parseInt(e.target.value) || 5})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.dataIntervalPlaceholder')}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sections.location')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.manufacturer')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.manufacturerPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.model')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.modelPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.floor')}
                      </label>
                      <input
                        type="number"
                        disabled={mode === 'view'}
                        value={formData.floor || ''}
                        onChange={(e) => setFormData({...formData, floor: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.floorPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('fields.zone')}
                      </label>
                      <input
                        type="text"
                        disabled={mode === 'view'}
                        value={formData.zone}
                        onChange={(e) => setFormData({...formData, zone: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('fields.zonePlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {t('actions.cancel')}
                  </button>
                  {mode !== 'view' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 accent-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? (mode === 'edit' ? t('actions.updating') : t('actions.creating')) : 
                       mode === 'edit' ? t('actions.update') : t('actions.create')}
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