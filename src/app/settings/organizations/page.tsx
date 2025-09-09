"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from "lucide-react";
import OrganizationModal from "@/components/admin/OrganizationModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from "@/lib/supabase/client";

export default function OrganizationSettingsPage() {
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch organizations from database
  const fetchOrganizations = async () => {
    console.log('Fetching organizations...');
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Fetch organizations the user belongs to
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from("user_organizations")
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            legal_name,
            slug,
            industry_primary,
            industry_secondary,
            company_size,
            website,
            primary_contact_email,
            primary_contact_phone,
            headquarters_address,
            subscription_tier,
            subscription_status,
            enabled_features,
            compliance_frameworks,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (userOrgsError) throw userOrgsError;

      console.log('Fetched user organizations:', userOrgs);

      // Transform the data to match our component's expectations
      const orgs = userOrgs?.map(uo => ({
        ...uo.organizations,
        role: uo.role,
        // Add computed fields (these would come from joins in a real app)
        sites: 0, // We'll update this when we connect sites
        users: 0, // We'll update this when we connect users
        status: uo.organizations?.subscription_status || 'active',
        industry: uo.organizations?.industry_primary || ''
      })) || [];

      // For each organization, fetch counts
      for (const org of orgs) {
        // Count sites
        const { count: sitesCount } = await supabase
          .from('sites')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        
        org.sites = sitesCount || 0;

        // Count users
        const { count: usersCount } = await supabase
          .from('user_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        
        org.users = usersCount || 0;
      }

      console.log('Setting organizations state with:', orgs);
      setOrganizations(orgs);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
      console.log('Fetch complete, loading set to false');
    }
  };

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Filter organizations based on search
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => 
      org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.legal_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, organizations]);

  // Pagination logic
  const totalItems = filteredOrganizations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredOrganizations.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Modal handlers
  const handleAdd = () => {
    setModalMode("create");
    setSelectedOrganization(null);
    setShowOrgModal(true);
  };

  const handleView = (org: any) => {
    setModalMode("view");
    setSelectedOrganization(org);
    setShowOrgModal(true);
  };

  const handleEdit = (org: any) => {
    setModalMode("edit");
    setSelectedOrganization(org);
    setShowOrgModal(true);
  };

  const handleDelete = async (org: any) => {
    if (confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', org.id);

        if (error) throw error;

        // Refresh the list
        await fetchOrganizations();
      } catch (err) {
        console.error('Error deleting organization:', err);
        alert('Failed to delete organization');
      }
    }
  };

  const handleModalClose = () => {
    setShowOrgModal(false);
    setSelectedOrganization(null);
    setModalMode("create");
  };

  const handleModalSuccess = async () => {
    console.log('Modal success callback triggered, refreshing organizations...');
    handleModalClose();
    // Refresh data immediately
    await fetchOrganizations();
  };

  // Pagination Component
  const PaginationControls = () => {
    return (
      <div className="mt-auto border-t border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-[#111111] rounded-b-lg p-3 sm:p-4">
        <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              aria-label="First page"
            >
              <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
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
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
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
              aria-label="Next page"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </nav>
      </div>
    );
  };

  return (
    <SettingsLayout pageTitle="Organizations">
      <div className="p-4 sm:p-6">
        {/* Header - Hidden on mobile */}
        <header className="hidden md:block mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Organization Management
          </h1>
          <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">
            Manage your organizations and their settings
          </p>
        </header>

        {/* Search Bar with Actions - New Design */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white hover:opacity-90 transition-opacity"
            title="Add Organization"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-white/[0.05] h-[700px] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={fetchOrganizations}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No organizations found</p>
                <button 
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90"
                >
                  Create Your First Organization
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-white/[0.05]">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Industry
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Sites
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Users
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {paginatedData.map((org: any) => (
                      <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {org.name}
                              </div>
                              <div className="text-xs text-[#616161] dark:text-[#757575] sm:hidden">
                                {org.industry || 'N/A'} • {org.sites} sites • {org.users} users
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden sm:table-cell">
                          {org.industry || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                          {org.sites}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                          {org.users}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            org.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                          }`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onPin={() => console.log('Pin organization:', org.name)}
                              onEdit={() => handleEdit(org)}
                              onDelete={() => handleDelete(org)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <PaginationControls />
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <OrganizationModal 
        key={`org-modal-${modalMode}-${selectedOrganization?.id || 'new'}`}
        isOpen={showOrgModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedOrganization}
      />
    </SettingsLayout>
  );
}