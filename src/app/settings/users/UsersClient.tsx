"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Phone,
  Mail
} from "lucide-react";
import UsersModal from "@/components/admin/UsersModal";
import ActionsDropdown from "@/components/ui/ActionsDropdown";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/providers/LanguageProvider';

interface AppUser {
  id: string;
  auth_user_id?: string;
  organization_id: string;
  organizations?: { name: string; slug: string };
  name: string;
  email: string;
  role: string;
  status: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  avgDailyTimeSpent?: number; // in minutes
}

interface UsersClientProps {
  initialUsers: AppUser[];
  organizations: any[];
  userRole: string;
}

export default function UsersClient({ initialUsers, organizations, userRole }: UsersClientProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations('settings.users');

  // Get session stats for multiple users via API
  const getSessionStats = async (userIds: string[]): Promise<Record<string, number>> => {
    try {
      const response = await fetch('/api/users/session-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session stats');
      }

      const data = await response.json();
      
      // Convert array of user stats to a record/map for easy lookup
      const statsMap: Record<string, number> = {};
      data.userStats.forEach((stat: { userId: string; avgDailyTimeSpent: number }) => {
        statsMap[stat.userId] = stat.avgDailyTimeSpent;
      });

      return statsMap;
    } catch (error) {
      console.error('Error fetching session stats:', error);
      return {};
    }
  };

  // Calculate time spent for initial users on mount
  useEffect(() => {
    const calculateInitialTimeSpent = async () => {
      if (!initialLoad) return;
      
      setLoading(true);
      try {
        // Collect all user IDs that have auth_user_id
        const userIds = initialUsers
          .filter(user => user.auth_user_id)
          .map(user => user.auth_user_id!);

        // Get session stats for all users at once
        const sessionStats = await getSessionStats(userIds);

        // Map the stats back to users
        const usersWithTimeSpent = initialUsers.map(userData => ({
          ...userData,
          avgDailyTimeSpent: userData.auth_user_id 
            ? sessionStats[userData.auth_user_id] || 0 
            : 0,
        }));

        setUsers(usersWithTimeSpent);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    calculateInitialTimeSpent();
  }, [initialUsers, initialLoad]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
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

      // Fetch users
      const { data: usersData, error } = await supabase
        .from('app_users')
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
        console.error('Error fetching users:', error);
        return;
      }

      // Calculate average daily time spent for each user
      const userIds = (usersData || [])
        .filter(user => user.auth_user_id)
        .map(user => user.auth_user_id!);

      const sessionStats = await getSessionStats(userIds);

      const usersWithTimeSpent = (usersData || []).map(userData => ({
        ...userData,
        avgDailyTimeSpent: userData.auth_user_id 
          ? sessionStats[userData.auth_user_id] || 0 
          : 0,
      }));

      setUsers(usersWithTimeSpent);
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
    if (!confirm(t('modal.confirmDelete'))) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting user:', error);
        alert(t('messages.error'));
        return;
      }

      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: AppUser) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handlePin = async (user: AppUser) => {
    // Implement pin functionality if needed
    console.log('Pin user:', user.name);
  };

  // Can user perform actions? Using RBAC roles (owner, manager, member, viewer)
  const canManage = userRole === 'super_admin' || userRole === 'owner' || userRole === 'manager';

  // Format role display
  const formatRole = (role: string) => {
    return t(`roles.${role}` as any) || role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'account_owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'sustainability_manager':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'facility_manager':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'analyst':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'viewer':
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

  // Format time spent in minutes to human readable format
  const formatTimeSpent = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 
      ? `${days}d ${remainingHours}h`
      : `${days}d`;
  };

  // Pagination Component
  const PaginationControls = () => {
    return (
      <nav aria-label="Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-3 sm:px-4 bg-gray-50 dark:bg-[#757575]/10 border-t border-gray-200 dark:border-white/[0.05] rounded-b-lg">
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
            {t('pagination.showing', {
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
              aria-label={t('pagination.firstPage')}
            >
              <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('pagination.previousPage')}
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
                        : "hover:bg-gray-200 dark:hover:bg-white/[0.05] text-gray-700 dark:text-[#757575] hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                    aria-label={t('pagination.page', { number: pageNum })}
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
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('pagination.nextPage')}
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('pagination.lastPage')}
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-xs sm:text-sm text-[#616161] dark:text-[#757575] mt-1">{t('subtitle')}</p>
      </header>

      <main className="p-4 sm:p-6">
        {/* Search and Add Button */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#757575]" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
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
                <p className="text-gray-500 dark:text-gray-400">{t('messages.loadingUsers')}</p>
              </div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('messages.noUsers')}</p>
                {canManage && (
                  <button
                    onClick={() => {
                      setModalMode('create');
                      setShowUserModal(true);
                    }}
                    className="mt-4 px-4 py-2 accent-gradient-lr text-white rounded-lg hover:opacity-90"
                  >
                    {t('modal.createTitle')}
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
                        {t('table.user')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        {t('table.organization')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        {t('table.created')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden md:table-cell">
                        {t('table.role')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t('table.lastLogin')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden sm:table-cell">
                        {t('table.status')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#616161] dark:text-[#757575] uppercase tracking-wider hidden lg:table-cell">
                        {t('table.dailyTime')}
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
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#616161] dark:text-[#757575] hidden md:table-cell">
                          {user.organizations?.name || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : t('status.inactive')}
                          </div>
                          {user.last_login && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(user.last_login).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {t(`modal.statuses.${user.status}` as any) || user.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatTimeSpent(user.avgDailyTimeSpent || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('table.avgPerDay')}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <ActionsDropdown
                              onView={() => handleView(user)}
                              onPin={() => handlePin(user)}
                              onEdit={canManage ? () => handleEdit(user) : undefined}
                              onDelete={canManage ? () => handleDelete(user) : undefined}
                              showView={true}
                              showPin={true}
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
        organizations={organizations}
        supabase={supabase}
      />
    </SettingsLayout>
  );
}