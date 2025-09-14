"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Cpu,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Wifi,
  WifiOff,
  AlertCircle
} from "lucide-react";
import DevicesModal from "@/components/admin/DevicesModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/providers/LanguageProvider';
import { auditLogger } from '@/lib/audit/client';

interface Device {
  id: string;
  name: string;
  type: string;
  site_id: string;
  sites?: { 
    name: string; 
    location: string;
    organizations?: { name: string; slug: string };
  };
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  ip_address?: string;
  mac_address?: string;
  protocol?: string;
  data_interval?: number;
  floor?: number;
  zone?: string;
  status: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  metadata?: { pinned?: boolean; [key: string]: any };
}

interface DevicesClientProps {
  initialDevices: Device[];
  sites: any[];
  organizations: any[];
  userRole: string;
}

export default function DevicesClient({ initialDevices, sites, organizations, userRole }: DevicesClientProps) {
  const t = useTranslations('settings.devices');
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return devices;
    
    return devices.filter(device => 
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.sites?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [devices, searchTerm]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleModalClose = () => {
    setShowDeviceModal(false);
    setSelectedDevice(null);
    setModalMode('create');
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refreshDevices();
  };

  const refreshDevices = async () => {
    setLoading(true);
    try {
      // Get user's organizations
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id);

      const organizationIds = userOrgs?.map(uo => uo.organization_id) || [];

      // Fetch sites
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id')
        .in('organization_id', organizationIds);

      const siteIds = sitesData?.map(s => s.id) || [];

      // Fetch devices
      const { data: devicesData, error } = await supabase
        .from('devices')
        .select(`
          *,
          sites (
            name,
            location,
            organizations (
              name,
              slug
            )
          )
        `)
        .in('site_id', siteIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        return;
      }

      setDevices(devicesData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setModalMode('edit');
    setShowDeviceModal(true);
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(t('confirmDelete', { name: device.name }))) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', device.id);

      if (error) {
        console.error('Error deleting device:', error);
        alert(t('failedToDelete'));
        return;
      }

      // Log audit event for device deletion
      await auditLogger.logDataOperation(
        'delete',
        'device',
        device.id,
        device.name,
        'success'
      );

      await refreshDevices();
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (device: Device) => {
    const isPinned = device.metadata?.pinned || false;
    const newPinnedState = !isPinned;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          metadata: {
            ...device.metadata,
            pinned: newPinnedState
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', device.id);

      if (error) {
        console.error('Error updating device pin status:', error);
        alert(t('failedToPin'));
        return;
      }

      // Update the local state
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d.id === device.id 
            ? { 
                ...d, 
                metadata: { ...d.metadata, pinned: newPinnedState } 
              }
            : d
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Can user perform actions?
  const canManage = userRole === 'super_admin' || userRole === 'owner' || userRole === 'manager';

  // Format last seen time
  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return t('table.never');
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return t('table.daysAgo', { count: days });
    if (hours > 0) return t('table.hoursAgo', { count: hours });
    if (minutes > 0) return t('table.minutesAgo', { count: minutes });
    return t('table.justNow');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'offline':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'maintenance':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-[#757575]/10">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            />
          </div>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t('filter')}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {canManage && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedDevice(null);
                setModalMode('create');
                setShowDeviceModal(true);
              }}
              className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
              title={t('addDevice')}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t('loadingDevices')}
            </div>
          ) : currentData.length === 0 ? (
            <div className="p-8 text-center">
              <Cpu className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noDevicesFound')}</p>
              {canManage && (
                <button
                  onClick={() => {
                    setSelectedDevice(null);
                    setModalMode('create');
                    setShowDeviceModal(true);
                  }}
                  className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  {t('createFirstDevice')}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05]">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                      {t('table.device')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                      {t('table.type')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                      {t('table.site')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                      {t('table.details')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                      {t('table.lastSeen')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                      {t('table.status')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                  {currentData.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center mr-3">
                            <Cpu className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {device.name}
                            </div>
                            {device.serial_number && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {t('table.serialNumber')}: {device.serial_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden sm:table-cell">
                        {device.type}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                        {device.sites?.name || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {device.manufacturer && device.model && (
                            <div>{device.manufacturer} {device.model}</div>
                          )}
                          {device.ip_address && (
                            <div>IP: {device.ip_address}</div>
                          )}
                          {device.floor && device.zone && (
                            <div>{t('table.floor')} {device.floor}, {device.zone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                        {formatLastSeen(device.last_seen)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(device.status)}`}>
                          {t(`status.${device.status || 'unknown'}`)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {device.metadata?.pinned && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" title="Pinned device" />
                          )}
                          <ActionsDropdown
                            onPin={() => handlePin(device)}
                            onEdit={canManage ? () => handleEdit(device) : undefined}
                            onDelete={canManage ? () => handleDelete(device) : undefined}
                            isPinned={device.metadata?.pinned || false}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('pagination.showing', { start: startIndex + 1, end: Math.min(endIndex, totalItems), total: totalItems })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-900 dark:text-white">
                {t('pagination.pageOf', { current: currentPage, total: totalPages })}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <DevicesModal
        isOpen={showDeviceModal}
        mode={modalMode}
        device={selectedDevice}
        sites={sites}
        organizations={organizations}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
