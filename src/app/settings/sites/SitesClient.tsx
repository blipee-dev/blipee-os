<<<<<<< HEAD
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
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
  Users,
  Layers
} from "lucide-react";
import SitesModal from "@/components/admin/SitesModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  name: string;
  location: string;
  organization_id: string;
  organizations?: { name: string; slug: string };
  type: string;
  total_area_sqm: number;
  total_employees: number;
  floors: number;
  floor_details: any[];
  status: string;
  devices_count: number;
  timezone: string;
  address: any;
  created_at: string;
  updated_at: string;
}

interface SitesClientProps {
  initialSites: Site[];
  organizations: any[];
  userRole: string;
}

export default function SitesClient({ initialSites, organizations, userRole }: SitesClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const supabase = createClient();
  const router = useRouter();

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return sites;
    
    return sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sites, searchTerm]);

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
    setShowSiteModal(false);
    setSelectedSite(null);
    setModalMode('create');
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refreshSites();
  };

  const refreshSites = async () => {
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
      const { data: sitesData, error } = await supabase
        .from('sites')
        .select(`
          *,
          organizations (
            name,
            slug
          )
        `)
        .in('organization_id', organizationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sites:', error);
        return;
      }

      // Count devices for each site
      const sitesWithCounts = await Promise.all(
        (sitesData || []).map(async (site) => {
          const { count } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);
          
          return {
            ...site,
            devices_count: count || 0
          };
        })
      );

      setSites(sitesWithCounts);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (site: Site) => {
    setModalMode('edit');
    setSelectedSite(site);
    setShowSiteModal(true);
  };

  const handleDelete = async (site: Site) => {
    if (!confirm(`Are you sure you want to delete ${site.name}?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', site.id);

      if (error) {
        console.error('Error deleting site:', error);
        alert('Failed to delete site');
        return;
      }

      await refreshSites();
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (site: Site) => {
    // Implement pin functionality if needed
    console.log('Pin site:', site.name);
  };

  // Can user perform actions?
  const canManage = userRole === 'account_owner' || userRole === 'admin' || userRole === 'manager';

  // Pagination Component
  const PaginationControls = () => {
    return (
      <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 px-4 sm:px-6 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-xs sm:text-sm text-[#616161] dark:text-[#757575]">
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-xs sm:text-sm bg-white dark:bg-[#212121] border border-gray-300 dark:border-white/[0.05] rounded-lg focus:ring-2 accent-ring"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="text-xs sm:text-sm text-[#616161] dark:text-[#757575]">
            Showing {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)} of {totalItems}
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
    <SettingsLayout pageTitle="Sites">
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Sites Management</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">Manage your sites and locations</p>
      </header>

      <main className="p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring text-sm"
            />
          </div>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Upload"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          {canManage && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setModalMode('create');
                setShowSiteModal(true);
              }}
              className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
              title="Add Site"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-white/[0.05] h-[700px] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 accent-border border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading sites...</p>
              </div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No sites found</p>
                {canManage && (
                  <button
                    onClick={() => {
                      setModalMode('create');
                      setShowSiteModal(true);
                    }}
                    className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90"
                  >
                    Add Your First Site
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#757575]/10 border-b border-gray-200 dark:border-white/[0.05] rounded-t-lg">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Location
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Organization
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        Details
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Devices
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {currentData.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {site.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {site.type || 'Office'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden sm:table-cell">
                          {site.location || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          {site.organizations?.name || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {site.total_area_sqm && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {site.total_area_sqm} sqm
                              </div>
                            )}
                            {site.total_employees && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {site.total_employees}
                              </div>
                            )}
                            {site.floors && (
                              <div className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {site.floors} floors
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                          {site.devices_count}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            site.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : site.status === 'inactive'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {site.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onPin={() => handlePin(site)}
                              onEdit={canManage ? () => handleEdit(site) : undefined}
                              onDelete={canManage ? () => handleDelete(site) : undefined}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls />
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <SitesModal 
        isOpen={showSiteModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedSite}
        supabase={supabase}
      />
    </SettingsLayout>
  );
}
||||||| 2cca3736
=======
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
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
  Users,
  Layers
} from "lucide-react";
import SitesModal from "@/components/admin/SitesModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  name: string;
  location: string;
  organization_id: string;
  organizations?: { name: string; slug: string };
  type: string;
  total_area_sqm: number;
  total_employees: number;
  floors: number;
  floor_details: any[];
  status: string;
  devices_count: number;
  timezone: string;
  address: any;
  created_at: string;
  updated_at: string;
}

interface SitesClientProps {
  initialSites: Site[];
  organizations: any[];
  userRole: string;
}

export default function SitesClient({ initialSites, organizations, userRole }: SitesClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const supabase = createClient();
  const router = useRouter();

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return sites;
    
    return sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sites, searchTerm]);

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
    setShowSiteModal(false);
    setSelectedSite(null);
    setModalMode('create');
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refreshSites();
  };

  const refreshSites = async () => {
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
      const { data: sitesData, error } = await supabase
        .from('sites')
        .select(`
          *,
          organizations (
            name,
            slug
          )
        `)
        .in('organization_id', organizationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sites:', error);
        return;
      }

      // Count devices for each site
      const sitesWithCounts = await Promise.all(
        (sitesData || []).map(async (site) => {
          const { count } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);
          
          return {
            ...site,
            devices_count: count || 0
          };
        })
      );

      setSites(sitesWithCounts);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (site: Site) => {
    setModalMode('edit');
    setSelectedSite(site);
    setShowSiteModal(true);
  };

  const handleDelete = async (site: Site) => {
    if (!confirm(`Are you sure you want to delete ${site.name}?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', site.id);

      if (error) {
        console.error('Error deleting site:', error);
        alert('Failed to delete site');
        return;
      }

      await refreshSites();
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (site: Site) => {
    // Implement pin functionality if needed
    console.log('Pin site:', site.name);
  };

  // Can user perform actions?
  const canManage = userRole === 'account_owner' || userRole === 'admin' || userRole === 'manager';

  // Pagination Component
  const PaginationControls = () => {
    return (
      <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-xs sm:text-sm text-[#616161] dark:text-[#757575]">
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-xs sm:text-sm bg-white dark:bg-[#212121] border border-gray-300 dark:border-white/[0.05] rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="text-xs sm:text-sm text-[#616161] dark:text-[#757575]">
            Showing {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)} of {totalItems}
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
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
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
    <SettingsLayout pageTitle="Sites">
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Sites Management</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">Manage your sites and locations</p>
      </header>

      <main className="p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            />
          </div>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button 
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title="Upload"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          {canManage && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setModalMode('create');
                setShowSiteModal(true);
              }}
              className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white hover:opacity-90 transition-opacity"
              title="Add Site"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading sites...
            </div>
          ) : currentData.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No sites found</p>
              {canManage && (
                <button
                  onClick={() => {
                    setModalMode('create');
                    setShowSiteModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Add Your First Site
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05]">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Location
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Organization
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        Details
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Devices
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {currentData.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {site.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {site.type || 'Office'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden sm:table-cell">
                          {site.location || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          {site.organizations?.name || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {site.total_area_sqm && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {site.total_area_sqm} sqm
                              </div>
                            )}
                            {site.total_employees && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {site.total_employees}
                              </div>
                            )}
                            {site.floors && (
                              <div className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {site.floors} floors
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                          {site.devices_count}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            site.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : site.status === 'inactive'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {site.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onPin={() => handlePin(site)}
                              onEdit={canManage ? () => handleEdit(site) : undefined}
                              onDelete={canManage ? () => handleDelete(site) : undefined}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls />
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      <SitesModal 
        isOpen={showSiteModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedSite}
      />
    </SettingsLayout>
  );
}
>>>>>>> origin/main
