"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Users, 
  Cpu,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import OrganizationModal from "@/components/admin/OrganizationModal";
import SitesModal from "@/components/admin/SitesModal";
import UsersModal from "@/components/admin/UsersModal";
import DevicesModal from "@/components/admin/DevicesModal";
import Tooltip from "@/components/ui/Tooltip";

type TabType = "organizations" | "sites" | "users" | "devices";

// Mock data for demonstration - expanded for pagination testing
const mockOrganizations = [
    { id: 1, name: "PLMJ", sites: 3, users: 48, status: "active", industry: "Legal Services" },
    { id: 2, name: "Tech Corp", sites: 5, users: 120, status: "active", industry: "Technology" },
    { id: 3, name: "Green Energy Ltd", sites: 4, users: 65, status: "active", industry: "Energy" },
    { id: 4, name: "Finance Group", sites: 8, users: 200, status: "active", industry: "Finance" },
    { id: 5, name: "Healthcare Plus", sites: 12, users: 350, status: "active", industry: "Healthcare" },
    { id: 6, name: "Retail Chain", sites: 25, users: 500, status: "active", industry: "Retail" },
    { id: 7, name: "Manufacturing Co", sites: 6, users: 180, status: "active", industry: "Manufacturing" },
    { id: 8, name: "Education Institute", sites: 3, users: 90, status: "active", industry: "Education" },
    { id: 9, name: "Transport Services", sites: 10, users: 250, status: "active", industry: "Transport" },
    { id: 10, name: "Media House", sites: 2, users: 45, status: "active", industry: "Media" },
    { id: 11, name: "Construction Ltd", sites: 7, users: 160, status: "active", industry: "Construction" },
    { id: 12, name: "Hospitality Group", sites: 15, users: 420, status: "active", industry: "Hospitality" },
  ];

  const mockSites = [
    { id: 1, name: "Headquarters", location: "Lisbon", organization: "PLMJ", devices: 45, status: "online" },
    { id: 2, name: "Porto Office", location: "Porto", organization: "PLMJ", devices: 32, status: "online" },
    { id: 3, name: "Faro Branch", location: "Faro", organization: "PLMJ", devices: 18, status: "offline" },
    { id: 4, name: "Madrid Office", location: "Madrid", organization: "Tech Corp", devices: 52, status: "online" },
    { id: 5, name: "Barcelona Hub", location: "Barcelona", organization: "Tech Corp", devices: 38, status: "online" },
    { id: 6, name: "London Office", location: "London", organization: "Finance Group", devices: 75, status: "online" },
    { id: 7, name: "Paris Branch", location: "Paris", organization: "Finance Group", devices: 60, status: "online" },
    { id: 8, name: "Berlin Center", location: "Berlin", organization: "Green Energy Ltd", devices: 42, status: "online" },
    { id: 9, name: "Amsterdam Office", location: "Amsterdam", organization: "Green Energy Ltd", devices: 35, status: "online" },
    { id: 10, name: "Rome Branch", location: "Rome", organization: "Retail Chain", devices: 28, status: "offline" },
    { id: 11, name: "Vienna Office", location: "Vienna", organization: "Healthcare Plus", devices: 55, status: "online" },
    { id: 12, name: "Brussels Hub", location: "Brussels", organization: "Manufacturing Co", devices: 48, status: "online" },
    { id: 13, name: "Dublin Center", location: "Dublin", organization: "Transport Services", devices: 40, status: "online" },
    { id: 14, name: "Copenhagen Office", location: "Copenhagen", organization: "Media House", devices: 22, status: "online" },
    { id: 15, name: "Stockholm Branch", location: "Stockholm", organization: "Construction Ltd", devices: 33, status: "online" },
  ];

  const mockUsers = [
    { id: 1, name: "João Silva", email: "joao@plmj.com", role: "Admin", organization: "PLMJ", lastActive: "2 hours ago" },
    { id: 2, name: "Maria Santos", email: "maria@plmj.com", role: "Manager", organization: "PLMJ", lastActive: "5 minutes ago" },
    { id: 3, name: "Pedro Costa", email: "pedro@plmj.com", role: "User", organization: "PLMJ", lastActive: "1 day ago" },
    { id: 4, name: "Ana Ferreira", email: "ana@techcorp.com", role: "Admin", organization: "Tech Corp", lastActive: "10 minutes ago" },
    { id: 5, name: "Carlos Mendes", email: "carlos@techcorp.com", role: "Manager", organization: "Tech Corp", lastActive: "3 hours ago" },
    { id: 6, name: "Sofia Rodrigues", email: "sofia@green.com", role: "User", organization: "Green Energy Ltd", lastActive: "30 minutes ago" },
    { id: 7, name: "Miguel Alves", email: "miguel@finance.com", role: "Admin", organization: "Finance Group", lastActive: "1 hour ago" },
    { id: 8, name: "Teresa Gomes", email: "teresa@health.com", role: "Manager", organization: "Healthcare Plus", lastActive: "2 days ago" },
    { id: 9, name: "Ricardo Pinto", email: "ricardo@retail.com", role: "User", organization: "Retail Chain", lastActive: "4 hours ago" },
    { id: 10, name: "Beatriz Lopes", email: "beatriz@manu.com", role: "Admin", organization: "Manufacturing Co", lastActive: "15 minutes ago" },
    { id: 11, name: "André Sousa", email: "andre@edu.com", role: "Manager", organization: "Education Institute", lastActive: "6 hours ago" },
    { id: 12, name: "Catarina Nunes", email: "catarina@transport.com", role: "User", organization: "Transport Services", lastActive: "45 minutes ago" },
    { id: 13, name: "Diogo Martins", email: "diogo@media.com", role: "Admin", organization: "Media House", lastActive: "20 minutes ago" },
    { id: 14, name: "Eva Pereira", email: "eva@construction.com", role: "Manager", organization: "Construction Ltd", lastActive: "3 days ago" },
    { id: 15, name: "Francisco Dias", email: "francisco@hospitality.com", role: "User", organization: "Hospitality Group", lastActive: "1 week ago" },
  ];

  const mockDevices = [
    { id: 1, name: "HVAC System 1", type: "HVAC", site: "Headquarters", status: "online", consumption: "125 kWh" },
    { id: 2, name: "Lighting Floor 1", type: "Lighting", site: "Headquarters", status: "online", consumption: "45 kWh" },
    { id: 3, name: "Solar Panel A", type: "Energy", site: "Porto Office", status: "online", generation: "320 kWh" },
    { id: 4, name: "HVAC System 2", type: "HVAC", site: "Porto Office", status: "online", consumption: "110 kWh" },
    { id: 5, name: "Lighting Floor 2", type: "Lighting", site: "Madrid Office", status: "online", consumption: "38 kWh" },
    { id: 6, name: "Solar Panel B", type: "Energy", site: "Barcelona Hub", status: "offline", generation: "280 kWh" },
    { id: 7, name: "HVAC System 3", type: "HVAC", site: "London Office", status: "online", consumption: "150 kWh" },
    { id: 8, name: "Emergency Lighting", type: "Lighting", site: "Paris Branch", status: "online", consumption: "15 kWh" },
    { id: 9, name: "Wind Turbine 1", type: "Energy", site: "Berlin Center", status: "online", generation: "450 kWh" },
    { id: 10, name: "HVAC System 4", type: "HVAC", site: "Amsterdam Office", status: "online", consumption: "95 kWh" },
    { id: 11, name: "Smart Lighting", type: "Lighting", site: "Rome Branch", status: "offline", consumption: "52 kWh" },
    { id: 12, name: "Battery Storage", type: "Energy", site: "Vienna Office", status: "online", generation: "200 kWh" },
    { id: 13, name: "HVAC System 5", type: "HVAC", site: "Brussels Hub", status: "online", consumption: "135 kWh" },
    { id: 14, name: "Outdoor Lighting", type: "Lighting", site: "Dublin Center", status: "online", consumption: "28 kWh" },
    { id: 15, name: "Solar Panel C", type: "Energy", site: "Copenhagen Office", status: "online", generation: "290 kWh" },
  ];

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("organizations");
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state management
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  
  // Pagination states for each tab
  const [currentPage, setCurrentPage] = useState<Record<TabType, number>>({
    organizations: 1,
    sites: 1,
    users: 1,
    devices: 1,
  });
  
  const [itemsPerPage, setItemsPerPage] = useState<Record<TabType, number>>({
    organizations: 10,
    sites: 10,
    users: 10,
    devices: 10,
  });

  const tabs = [
    { id: "organizations" as TabType, label: "Organizations", icon: Building2, count: mockOrganizations.length },
    { id: "sites" as TabType, label: "Sites", icon: MapPin, count: mockSites.length },
    { id: "users" as TabType, label: "Users", icon: Users, count: mockUsers.length },
    { id: "devices" as TabType, label: "Devices", icon: Cpu, count: mockDevices.length },
  ];

  // Get data for current tab
  const getDataForTab = () => {
    switch (activeTab) {
      case "organizations":
        return mockOrganizations;
      case "sites":
        return mockSites;
      case "users":
        return mockUsers;
      case "devices":
        return mockDevices;
    }
  };

  // Pagination logic
  const currentData = getDataForTab();
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage[activeTab]);
  const startIndex = (currentPage[activeTab] - 1) * itemsPerPage[activeTab];
  const endIndex = startIndex + itemsPerPage[activeTab];
  const paginatedData = currentData.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(prev => ({ ...prev, [activeTab]: page }));
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(prev => ({ ...prev, [activeTab]: items }));
    setCurrentPage(prev => ({ ...prev, [activeTab]: 1 })); // Reset to first page
  };

  // Reset page when changing tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Optionally reset to page 1 when switching tabs
    // setCurrentPage(prev => ({ ...prev, [tab]: 1 }));
  };

  const getModalForTab = () => {
    switch (activeTab) {
      case "organizations":
        return { show: showOrgModal, setShow: setShowOrgModal };
      case "sites":
        return { show: showSiteModal, setShow: setShowSiteModal };
      case "users":
        return { show: showUserModal, setShow: setShowUserModal };
      case "devices":
        return { show: showDeviceModal, setShow: setShowDeviceModal };
    }
  };

  // Modal handlers
  const handleAdd = () => {
    setModalMode("add");
    setSelectedOrganization(null);
    setSelectedSite(null);
    setSelectedUser(null);
    setSelectedDevice(null);
    getModalForTab().setShow(true);
  };

  const handleView = (item: any) => {
    setModalMode("view");
    switch (activeTab) {
      case "organizations":
        setSelectedOrganization(item);
        setShowOrgModal(true);
        break;
      case "sites":
        setSelectedSite(item);
        setShowSiteModal(true);
        break;
      case "users":
        setSelectedUser(item);
        setShowUserModal(true);
        break;
      case "devices":
        setSelectedDevice(item);
        setShowDeviceModal(true);
        break;
    }
  };

  const handleEdit = (item: any) => {
    setModalMode("edit");
    switch (activeTab) {
      case "organizations":
        setSelectedOrganization(item);
        setShowOrgModal(true);
        break;
      case "sites":
        setSelectedSite(item);
        setShowSiteModal(true);
        break;
      case "users":
        setSelectedUser(item);
        setShowUserModal(true);
        break;
      case "devices":
        setSelectedDevice(item);
        setShowDeviceModal(true);
        break;
    }
  };

  const handleDelete = (item: any) => {
    const itemName = item.name;
    if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
      // Here you would typically call an API to delete the item
      alert(`${itemName} would be deleted (API call needed)`);
      // After successful deletion, you could refresh the data
    }
  };

  const handleModalClose = () => {
    setShowOrgModal(false);
    setShowSiteModal(false);
    setShowUserModal(false);
    setShowDeviceModal(false);
    setSelectedOrganization(null);
    setSelectedSite(null);
    setSelectedUser(null);
    setSelectedDevice(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    // Refresh data here - typically you'd refetch from your API
    alert("Operation completed successfully!");
  };

  // Pagination Component
  const PaginationControls = () => {
    return (
      <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 sm:px-6">
      {/* Items per page selector and page info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="items-per-page" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Items per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage[activeTab]}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
        </span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* First page */}
        <Tooltip content="Go to first page" position="top" delay={300}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage[activeTab] === 1}
            aria-label="Go to first page"
            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Previous page */}
        <Tooltip content="Previous page" position="top" delay={300}>
          <button
            onClick={() => handlePageChange(currentPage[activeTab] - 1)}
            disabled={currentPage[activeTab] === 1}
            aria-label="Go to previous page"
            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage[activeTab] <= 3) {
              pageNum = i + 1;
            } else if (currentPage[activeTab] >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage[activeTab] - 2 + i;
            }

            if (pageNum < 1 || pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                  currentPage[activeTab] === pageNum
                    ? "bg-purple-500 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <Tooltip content="Next page" position="top" delay={300}>
          <button
            onClick={() => handlePageChange(currentPage[activeTab] + 1)}
            disabled={currentPage[activeTab] === totalPages}
            aria-label="Go to next page"
            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Last page */}
        <Tooltip content="Go to last page" position="top" delay={300}>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage[activeTab] === totalPages}
            aria-label="Go to last page"
            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
  };

  return (
    <div className="bg-white dark:bg-[#212121] min-h-screen" role="main">
      {/* Skip to main content for screen readers */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-purple-600 text-white px-4 py-2 rounded-lg z-50">
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700" role="banner">
        <h1 id="page-title" className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Organization Management</h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your organizations, sites, users, and devices</p>
      </header>

      {/* Main Content */}
      <main id="main-content" className="p-4 sm:p-6" aria-labelledby="page-title">
        {/* Tabs and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tabs - Horizontal scroll on mobile */}
          <nav className="flex gap-1 overflow-x-auto pb-2 sm:pb-0" role="tablist" aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tooltip key={tab.id} content={`Switch to ${tab.label} tab`} position="bottom" delay={300}>
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    className={`
                      relative flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                      ${activeTab === tab.id
                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                    <span className="px-1 sm:px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs" aria-label={`${tab.count} ${tab.label.toLowerCase()}`}>
                      {tab.count}
                    </span>
                  </button>
                </Tooltip>
              );
            })}
          </nav>

          {/* Add Button */}
          <Tooltip content={`Add new ${activeTab.slice(0, -1)}`} position="bottom" delay={300}>
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTab.slice(0, -1)}</span>
            </button>
          </Tooltip>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <Tooltip content={`Search ${activeTab}`} position="top" delay={300}>
              <input
                type="text"
                aria-label={`Search ${activeTab}`}
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            </Tooltip>
          </div>
          
          {/* Filter buttons - Stack on mobile */}
          <div className="flex gap-2 sm:gap-3">
            <Tooltip content="Filter results" position="top" delay={300}>
              <button aria-label="Filter results" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm">
                <Filter className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </Tooltip>
            <Tooltip content="Export to CSV" position="top" delay={300}>
              <button aria-label="Export data" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm">
                <Download className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </Tooltip>
            <Tooltip content="Import from file" position="top" delay={300}>
              <button aria-label="Import data" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm">
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Import</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Table Content - Scrollable on mobile */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "organizations" && (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Industry
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Sites
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Users
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((org: any) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                              {org.sites} sites • {org.users} users
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {org.industry}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {org.sites}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {org.users}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Tooltip content="View details" position="top" delay={300}>
                            <button 
                              onClick={() => handleView(org)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Edit organization`} position="top" delay={300}>
                            <button 
                              onClick={() => handleEdit(org)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Delete organization`} position="top" delay={300}>
                            <button 
                              onClick={() => handleDelete(org)}
                              className="p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "sites" && (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Location
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Organization
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Devices
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((site: any) => (
                    <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{site.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                              {site.location} • {site.devices} devices • {site.status}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {site.location}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {site.organization}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {site.devices}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          site.status === "online" 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                        }`}>
                          {site.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Tooltip content="View details" position="top" delay={300}>
                            <button 
                              onClick={() => handleView(site)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Edit site`} position="top" delay={300}>
                            <button 
                              onClick={() => handleEdit(site)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Delete site`} position="top" delay={300}>
                            <button 
                              onClick={() => handleDelete(site)}
                              className="p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "users" && (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Organization
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Last Active
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                              {user.role} • {user.lastActive}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {user.email}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-lg text-xs font-medium">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {user.organization}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {user.lastActive}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Tooltip content="View details" position="top" delay={300}>
                            <button 
                              onClick={() => handleView(user)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Edit user`} position="top" delay={300}>
                            <button 
                              onClick={() => handleEdit(user)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Delete user`} position="top" delay={300}>
                            <button 
                              onClick={() => handleDelete(user)}
                              className="p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "devices" && (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Site
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Energy
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((device: any) => (
                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                              {device.type} • {device.status} • {device.consumption || device.generation}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {device.type}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {device.site}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          device.status === "online" 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                        }`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {device.consumption || device.generation}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Tooltip content="View details" position="top" delay={300}>
                            <button 
                              onClick={() => handleView(device)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Edit device`} position="top" delay={300}>
                            <button 
                              onClick={() => handleEdit(device)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={`Delete device`} position="top" delay={300}>
                            <button 
                              onClick={() => handleDelete(device)}
                              className="p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Pagination Controls */}
        <PaginationControls />
      </main>

      {/* Modals */}
      <OrganizationModal
        isOpen={showOrgModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedOrganization}
      />
      
      <SitesModal 
        isOpen={showSiteModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedSite}
      />
      
      <UsersModal 
        isOpen={showUserModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedUser}
      />
      
      <DevicesModal 
        isOpen={showDeviceModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedDevice}
      />
    </div>
  );
}