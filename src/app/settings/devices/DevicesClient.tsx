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
  Building2,
  MapPin,
  Activity
} from "lucide-react";
import DevicesModal from "@/components/admin/DevicesModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/providers/LanguageProvider';
import { auditLogger } from '@/lib/audit/client';

interface Device {
  id: string;
  name: string;
  site_id: string;
  sites?: {
    name: string;
    location: string;
    organizations: {
      name: string;
      slug: string;
    };
  };
  type: string;
  manufacturer?: string;
  model?: string;
  status: string;
  api_endpoint?: string;
  protocol?: string;
  authentication?: any;
  created_at: string;
  updated_at: string;
  last_sync?: string;
  sync_frequency?: string;
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

  const formatDeviceType = (type: string) => {
    if (!type) return '-';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return devices;

    return devices.filter(device =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.sites?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.sites?.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setLoading(true);
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error refreshing devices:', error);
    } finally {
      setLoading(false);
      handleModalClose();
    }
  };

  const handleCreateDevice = () => {
    setModalMode('create');
    setSelectedDevice(null);
    setShowDeviceModal(true);
  };

  const handleViewDevice = (device: Device) => {
    setModalMode('view');
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device: Device) => {
    setModalMode('edit');
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (device: Device) => {
    if (!confirm(t('confirmDelete', { name: device.name }))) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', device.id);

      if (error) throw error;

      await auditLogger.log('device_deleted', {
        device_id: device.id,
        device_name: device.name
      });

      setDevices(devices.filter(d => d.id !== device.id));
    } catch (error) {
      console.error('Error deleting device:', error);
      alert(t('deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const canEdit = userRole === 'super_admin' || userRole === 'account_owner' || userRole === 'facility_manager';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-400/10';
      case 'offline':
        return 'text-red-400 bg-red-400/10';
      case 'maintenance':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // Pagination Component matching sites page
  const PaginationControls = () => {
    return (
      <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 px-4 sm:px-6 bg-white dark:bg-[#212121] border-t border-gray-200 dark:border-white/[0.05] rounded-b-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs sm:text-sm text-gray-700 dark:text-[#757575]">
              {t('pagination.itemsPerPage')}
            </span>
            <CustomDropdown
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              options={[
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
            />
          </div>

          <div className="text-xs sm:text-sm text-gray-700 dark:text-[#757575]">
            {t('pagination.showing')} {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)} {t('pagination.of')} {totalItems}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  const current = currentPage;
                  if (current <= 3) {
                    pageNum = i + 1;
                  } else if (current >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = current - 2 + i;
                  }
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`
                      px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors
                      ${currentPage === pageNum
                        ? "accent-gradient-lr text-white"
                        : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-[#616161] dark:text-[#757575]"
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </nav>
    );
  };

  return (
    <SettingsLayout pageTitle={t('title')}>
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">{t('subtitle')}</p>
      </header>

      <main className="p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t('buttons.filter')}
          >
            <Filter className="w-4 h-4" />
          </button>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t('buttons.download')}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t('buttons.upload')}
          >
            <Upload className="w-4 h-4" />
          </button>

          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateDevice}
              className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
              title={t('buttons.addDevice')}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 accent-border border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">{t('loading.loadingDevices')}</p>
              </div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('empty.noDevices')}</p>
                {canEdit && (
                  <button
                    onClick={handleCreateDevice}
                    className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90"
                  >
                    {t('empty.addFirst')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#757575]/10 border-b border-gray-200 dark:border-white/[0.05] rounded-t-lg">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        {t('table.headers.device')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t('table.headers.site')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        {t('table.headers.type')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        {t('table.headers.details')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t('table.headers.status')}
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
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {device.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{device.sites?.name || t('unknown')}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          {formatDeviceType(device.type)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {device.manufacturer && device.manufacturer !== 'Unknown' && (
                              <div>{device.manufacturer}</div>
                            )}
                            {device.model && device.model !== 'Unknown' && (
                              <div>{device.model}</div>
                            )}
                            {(!device.manufacturer || device.manufacturer === 'Unknown') &&
                             (!device.model || device.model === 'Unknown') && (
                              <div>-</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.status === 'online' || device.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : device.status === 'offline'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {(() => {
                              const status = device.status || 'offline';
                              const translationKey = `table.status.${status}`;
                              const translated = t(translationKey);
                              // If translation returns the key itself, use the status as-is with proper casing
                              return translated === `settings.devices.${translationKey}`
                                ? status.charAt(0).toUpperCase() + status.slice(1)
                                : translated;
                            })()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onView={() => handleViewDevice(device)}
                              onEdit={canEdit ? () => handleEditDevice(device) : undefined}
                              onDelete={canEdit ? () => handleDeleteDevice(device) : undefined}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && <PaginationControls />}
            </div>
          )}
        </div>
      </main>

      {/* Device Modal */}
      {showDeviceModal && (
        <DevicesModal
          isOpen={showDeviceModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          mode={modalMode}
          device={selectedDevice}
          sites={sites}
          organizations={organizations}
        />
      )}
    </SettingsLayout>
  );
}