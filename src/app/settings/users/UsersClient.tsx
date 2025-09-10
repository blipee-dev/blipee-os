"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  ShieldCheck,
  Phone,
  Mail
} from "lucide-react";
import UsersModal from "@/components/admin/UsersModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AppUser {
  id: string;
  auth_user_id?: string;
  organization_id: string;
  organizations?: { name: string; slug: string };
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  title?: string;
  location?: string;
  join_date?: string;
  last_active?: string;
  permissions?: string[];
  two_factor_enabled?: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UsersClientProps {
  initialUsers: AppUser[];
  organizations: any[];
  userRole: string;
}

export default function UsersClient({ initialUsers, organizations, userRole }: UsersClientProps) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const supabase = createClient();
  const router = useRouter();

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

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
    setShowUserModal(false);
    setSelectedUser(null);
    setModalMode('create');
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refreshUsers();
  };

  const refreshUsers = async () => {
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

      // Fetch app users
      const { data: appUsersData, error } = await supabase
        .from('app_users')
        .select(`
          *,
          organizations:organization_id (
            name,
            slug
          )
        `)
        .in('organization_id', organizationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(appUsersData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
        return;
      }

      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (user: AppUser) => {
    // Implement pin functionality if needed
    console.log('Pin user:', user.name);
  };

  // Can user perform actions?
  const canManage = userRole === 'account_owner' || userRole === 'admin';

  // Format last active time
  const formatLastActive = (lastActive: string) => {
    if (!lastActive) return 'Never';
    const date = new Date(lastActive);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'account_owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'admin':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'manager':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400';
      case 'user':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

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
    <SettingsLayout pageTitle="Users">
      <header className="hidden md:block p-4 sm:p-6 border-b border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Users Management</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">Manage user accounts and permissions</p>
      </header>

      <main className="p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder="Search users..."
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
                setShowUserModal(true);
              }}
              className="p-2.5 accent-gradient-lr rounded-lg text-white hover:opacity-90 transition-opacity"
              title="Add User"
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
                <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
              </div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
                {canManage && (
                  <button
                    onClick={() => {
                      setModalMode('create');
                      setShowUserModal(true);
                    }}
                    className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90"
                  >
                    Add Your First User
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
                        User
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Contact
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Role
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        Organization
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        Last Active
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {currentData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center mr-3">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              {user.title && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.two_factor_enabled && (
                            <ShieldCheck className="w-3 h-3 text-green-500 inline-block ml-1" title="2FA Enabled" />
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          {user.organizations?.name || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                          {formatLastActive(user.last_active || user.updated_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onPin={() => handlePin(user)}
                              onEdit={canManage ? () => handleEdit(user) : undefined}
                              onDelete={canManage ? () => handleDelete(user) : undefined}
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
      <UsersModal 
        isOpen={showUserModal} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedUser}
      />
    </SettingsLayout>
  );
}