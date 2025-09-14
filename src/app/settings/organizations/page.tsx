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
  Loader2,
} from "lucide-react";
import OrganizationModal from "@/components/admin/OrganizationModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { auditLogger } from "@/lib/audit/client";

export default function OrganizationSettingsPage() {
  // Check authentication and redirect if not authenticated
  useAuthRedirect('/settings/organizations');
  
  const t = useTranslations("settings.organizations");
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch organizations from database
  const fetchOrganizations = async () => {
    console.log("Fetching organizations...");
    try {
      setLoading(true);
      setError(null);

      // Get current user - try multiple methods
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
      }

      if (!user) {
        // Try getting session as fallback
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session check:", session);

        if (!session?.user) {
          setError(t("userNotAuthenticated"));
          return;
        }
        // Use session user if available
        const sessionUser = session.user;
        console.log("Using session user:", sessionUser.email);
      }

      const currentUser =
        user || (await supabase.auth.getSession()).data.session?.user;
      if (!currentUser) {
        setError(t("userNotAuthenticated"));
        return;
      }

      console.log("Current user ID:", currentUser.id);
      console.log("Current user email:", currentUser.email);

      // Check if user is a super admin
      const { data: superAdminCheck, error: superAdminError } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // Handle the error gracefully - likely RLS policy blocking access
      const isSuperAdmin = !superAdminError && !!superAdminCheck;
      console.log("Is super admin:", isSuperAdmin);

      let orgs = [];

      if (isSuperAdmin) {
        // Super admins see ALL organizations
        console.log("Fetching ALL organizations for super admin...");
        const { data: allOrgs, error: allOrgsError } = await supabase.from(
          "organizations",
        ).select(`
            id,
            name,
            legal_name,
            slug,
            industry_primary,
            industry_secondary,
            company_size,
            website,
            logo_url,
            public_company,
            stock_ticker,
            primary_contact_email,
            primary_contact_phone,
            headquarters_address,
            billing_address,
            subscription_tier,
            subscription_status,
            subscription_seats,
            subscription_started_at,
            subscription_expires_at,
            enabled_features,
            compliance_frameworks,
            brand_colors,
            data_residency_region,
            gri_sector_id,
            industry_classification_id,
            industry_confidence,
            account_owner_id,
            metadata,
            settings,
            created_at,
            updated_at
          `);

        if (allOrgsError) throw allOrgsError;

        // Transform to match expected format
        orgs =
          allOrgs?.map((org) => ({
            ...org,
            role: "super_admin", // Super admins have special role
            sites: 0, // Will be updated below
            users: 0, // Will be updated below
            status: org.subscription_status || "active",
            industry: org.industry_primary || "",
          })) || [];

        console.log("Fetched all organizations for super admin:", allOrgs);
      } else {
        // Regular users only see their organizations through user_access table
        console.log("Fetching user organizations via user_access...");

        // First get the user's access records
        const { data: userAccess, error: userAccessError } = await supabase
          .from("user_access")
          .select("resource_id, role")
          .eq("user_id", currentUser.id)
          .eq("resource_type", "organization");

        if (userAccessError) throw userAccessError;

        console.log("Fetched user access:", userAccess);

        // If user has access to organizations, fetch them
        if (userAccess && userAccess.length > 0) {
          const orgIds = userAccess.map((ua) => ua.resource_id);

          const { data: userOrgs, error: orgsError } = await supabase
            .from("organizations")
            .select(
              `
              id,
              name,
              legal_name,
              slug,
              industry_primary,
              industry_secondary,
              company_size,
              website,
              logo_url,
              public_company,
              stock_ticker,
              primary_contact_email,
              primary_contact_phone,
              headquarters_address,
              billing_address,
              subscription_tier,
              subscription_status,
              subscription_seats,
              subscription_started_at,
              subscription_expires_at,
              enabled_features,
              compliance_frameworks,
              brand_colors,
              data_residency_region,
              gri_sector_id,
              industry_classification_id,
              industry_confidence,
              account_owner_id,
              metadata,
              settings,
              created_at,
              updated_at
            `,
            )
            .in("id", orgIds);

          if (orgsError) throw orgsError;

          // Map organizations with their roles
          orgs =
            userOrgs?.map((org) => {
              const access = userAccess.find((ua) => ua.resource_id === org.id);
              return {
                ...org,
                role: access?.role || "viewer",
                sites: 0, // Will be updated below
                users: 0, // Will be updated below
                status: org.subscription_status || "active",
                industry: org.industry_primary || "",
              };
            }) || [];
        }
      }

      // For each organization, fetch counts
      for (const org of orgs) {
        // Count sites
        const { count: sitesCount } = await supabase
          .from("sites")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        org.sites = sitesCount || 0;

        // Count users in organization
        const { count: usersCount } = await supabase
          .from("user_access")
          .select("*", { count: "exact", head: true })
          .eq("resource_id", org.id)
          .eq("resource_type", "organization");

        org.users = usersCount || 0;
      }

      console.log("Setting organizations state with:", orgs);
      setOrganizations(orgs);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError(t("failedToLoad"));
    } finally {
      setLoading(false);
      console.log("Fetch complete, loading set to false");
    }
  };

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Filter organizations based on search
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(
      (org) =>
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()),
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
    if (confirm(t("deleteConfirmation", { name: org.name }))) {
      try {
        const { error } = await supabase
          .from("organizations")
          .delete()
          .eq("id", org.id);

        if (error) throw error;

        // Log the delete operation
        await auditLogger.logDataOperation(
          'delete',
          'organization',
          org.id,
          org.name,
          'success',
          {
            before: org
          }
        );

        // Refresh the list
        await fetchOrganizations();
      } catch (err) {
        console.error("Error deleting organization:", err);

        // Log the failed delete
        await auditLogger.logDataOperation(
          'delete',
          'organization',
          org.id,
          org.name,
          'failure'
        );
        alert(t("failedToDelete"));
      }
    }
  };

  const handleModalClose = () => {
    setShowOrgModal(false);
    setSelectedOrganization(null);
    setModalMode("create");
  };

  const handleModalSuccess = async () => {
    console.log(
      "Modal success callback triggered, refreshing organizations...",
    );
    handleModalClose();
    // Refresh data immediately
    await fetchOrganizations();
  };

  // Pagination Component
  const PaginationControls = () => {
    return (
      <div className="mt-auto border-t border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-[#757575]/10 rounded-b-lg p-3 sm:p-4">
        <nav
          aria-label="Pagination Navigation"
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <label className="hidden sm:block text-xs sm:text-sm text-gray-700 dark:text-[#757575]">
                {t("pagination.itemsPerPage")}
              </label>
              <CustomDropdown
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                options={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 50, label: "50" },
                ]}
                className="w-16"
              />
            </div>

            <div className="text-xs sm:text-sm text-gray-700 dark:text-[#757575]">
              {t("pagination.showing", {
                start: Math.min(startIndex + 1, totalItems),
                end: Math.min(endIndex, totalItems),
                total: totalItems,
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("pagination.firstPage")}
              >
                <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("pagination.previousPage")}
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
                      ${
                        currentPage === pageNum
                          ? "accent-gradient-lr text-white"
                          : "hover:bg-gray-200 dark:hover:bg-white/[0.05] text-gray-700 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                      aria-label={t("pagination.page", { number: pageNum })}
                      aria-current={
                        currentPage === pageNum ? "page" : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("pagination.nextPage")}
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("pagination.lastPage")}
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
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">
            {t("subtitle")}
          </p>
        </header>

        {/* Search Bar with Actions - New Design */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#757575] focus:outline-none focus:ring-2 accent-ring text-sm"
            />
          </div>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t("filter")}
          >
            <Filter className="w-4 h-4" />
          </button>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t("download")}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            className="p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-600 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            title={t("upload")}
          >
            <Upload className="w-4 h-4" />
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
            title={t("addOrganization")}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-white/[0.05] h-[700px] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin accent-text" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="accent-text font-medium">{error}</p>
              <button
                onClick={fetchOrganizations}
                className="mt-4 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-80"
              >
                {t("retry")}
              </button>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t("noOrganizationsFound")}
                </p>
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90"
                >
                  {t("createFirstOrganization")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#757575]/10 border-b border-gray-200 dark:border-white/[0.05] rounded-t-lg">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        {t("table.organization")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        {t("table.industry")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        {t("table.subscription")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t("table.sites")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t("table.users")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t("table.status")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {paginatedData.map((org: any) => (
                      <tr
                        key={org.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-8 h-8 flex items-center justify-center mr-3 rounded-lg accent-gradient"
                              style={
                                org.brand_colors?.primary
                                  ? {
                                      background: `linear-gradient(135deg, ${org.brand_colors.primary}, ${org.brand_colors.secondary || org.brand_colors.primary})`,
                                    }
                                  : undefined
                              }
                            >
                              {org.logo_url ? (
                                <img
                                  src={org.logo_url}
                                  alt={`${org.name} logo`}
                                  className="w-5 h-5 rounded"
                                />
                              ) : (
                                <Building2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {org.name}
                                </div>
                                {org.public_company && org.stock_ticker && (
                                  <span className="text-xs accent-gradient-lr text-white px-2 py-1 rounded-full">
                                    {org.stock_ticker}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#616161] dark:text-[#757575] sm:hidden">
                                {org.industry_primary || "N/A"} • {org.sites}{" "}
                                sites • {org.users} users
                              </div>
                              {org.legal_name &&
                                org.legal_name !== org.name && (
                                  <div className="text-xs text-[#616161] dark:text-[#757575] hidden sm:block">
                                    {org.legal_name}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                          <div>
                            <div>{org.industry_primary || "N/A"}</div>
                            {org.industry_secondary && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {org.industry_secondary}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {org.subscription_tier?.toLowerCase() === "enterprise" ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full accent-gradient"></div>
                                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    Enterprise
                                  </span>
                                </div>
                              ) : org.subscription_tier?.toLowerCase() === "professional" ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full accent-gradient opacity-70"></div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Professional
                                  </span>
                                </div>
                              ) : org.subscription_tier?.toLowerCase() === "starter" ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Starter
                                  </span>
                                </div>
                              ) : org.subscription_tier?.toLowerCase() === "trial" || org.subscription_tier?.toLowerCase() === "trialing" ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    Trial
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {org.subscription_tier || "No Plan"}
                                  </span>
                                </div>
                              )}
                            </div>
                            {org.subscription_seats && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>{org.subscription_seats} seats</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {org.sites}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {org.users}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              org.subscription_status === "active"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : org.subscription_status === "trialing"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                : org.subscription_status === "suspended"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                : org.subscription_status === "cancelled"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                  : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {t(
                              `modal.subscriptionStatuses.${org.subscription_status}`,
                            ) || org.subscription_status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onPin={() =>
                                console.log("Pin organization:", org.name)
                              }
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
        key={`org-modal-${modalMode}-${selectedOrganization?.id || "new"}`}
        isOpen={showOrgModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedOrganization}
        supabase={supabase}
      />
    </SettingsLayout>
  );
}
