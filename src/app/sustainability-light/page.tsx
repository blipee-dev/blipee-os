'use client';

/**
 * COMPLETE PAGE REDESIGN - Firecrawl-Inspired Bold Minimal Aesthetic
 * URL: /sustainability-light
 *
 * This is a COMPLETE redesign of EVERY element:
 * - Custom minimal header (no sidebar)
 * - Horizontal navigation bar
 * - Minimal filter controls
 * - All dashboard content with bold design
 * - Pure white background
 * - Huge numbers (60-80px)
 * - Massive whitespace (60-80px gaps)
 * - Single green accent
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { OverviewDashboardMinimal } from '@/components/dashboard/OverviewDashboardMinimal';
import { useTranslations } from '@/providers/LanguageProvider';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { FloatingChat } from '@/components/blipee-os/FloatingChat';
import type { Building } from '@/types/auth';

// Minimal Site Selector
function MinimalSiteSelector({
  currentSite,
  onSiteChange
}: {
  currentSite: Building | null;
  onSiteChange: (site: Building | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sites, setSites] = useState<Building[]>([]);
  const { session } = useAuth();

  useEffect(() => {
    const loadSites = async () => {
      try {
        if (!session?.current_organization) return;
        const response = await fetch(
          `/api/organizations/${session.current_organization.id}/buildings`,
        );
        if (response.ok) {
          const data = await response.json();
          setSites(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load sites:', error);
      }
    };

    if (session?.current_organization) {
      loadSites();
    }
  }, [session?.current_organization]);

  const displayLabel = currentSite ? currentSite.name : 'All Sites';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-light text-gray-900 hover:text-gray-600 transition-colors border-b border-transparent hover:border-gray-300"
      >
        <Building2 className="w-4 h-4" />
        <span>{displayLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-lg z-20"
            >
              <div className="p-2">
                <button
                  onClick={() => {
                    onSiteChange(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    !currentSite
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-light">All Sites</span>
                </button>

                {sites.length > 0 && (
                  <div className="border-t border-gray-100 my-2" />
                )}

                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      onSiteChange(site);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentSite?.id === site.id
                        ? 'bg-green-50 text-green-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="font-light">{site.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal Period Selector
function MinimalPeriodSelector({
  currentPeriod,
  onPeriodChange
}: {
  currentPeriod: { id: string; label: string; start: string; end: string; type: string };
  onPeriodChange: (period: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const periods = [
    {
      id: 'current-year',
      label: new Date().getFullYear().toString(),
      start: `${new Date().getFullYear()}-01-01`,
      end: `${new Date().getFullYear()}-12-31`,
      type: 'year'
    },
    {
      id: 'last-year',
      label: (new Date().getFullYear() - 1).toString(),
      start: `${new Date().getFullYear() - 1}-01-01`,
      end: `${new Date().getFullYear() - 1}-12-31`,
      type: 'year'
    },
    {
      id: 'last-12-months',
      label: 'Last 12 Months',
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      type: 'rolling'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-light text-gray-900 hover:text-gray-600 transition-colors border-b border-transparent hover:border-gray-300"
      >
        <Calendar className="w-4 h-4" />
        <span>{currentPeriod.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-20"
            >
              <div className="p-2">
                {periods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => {
                      onPeriodChange(period);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentPeriod.id === period.id
                        ? 'bg-green-50 text-green-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-light">{period.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal Navigation Menu
function MinimalNavMenu({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { label: 'Overview', href: '/sustainability-light' },
    { label: 'Emissions', href: '/sustainability/ghg-emissions' },
    { label: 'Energy', href: '/sustainability/energy' },
    { label: 'Water', href: '/sustainability/water' },
    { label: 'Waste', href: '/sustainability/waste' },
    { label: 'Compliance', href: '/sustainability/compliance' },
    ...(isSuperAdmin ? [
      { label: 'Targets', href: '/sustainability/targets' },
      { label: 'Data', href: '/sustainability/data' },
      { label: 'Intelligence', href: '/sustainability/intelligence' },
      { label: 'AI Assistant', href: '/sustainability/ai-assistant' },
    ] : []),
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-light text-gray-900 hover:text-gray-600 transition-colors"
      >
        <Menu className="w-4 h-4" />
        <span>Menu</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-20"
            >
              <div className="p-2">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {item.label}
                  </button>
                ))}

                <div className="border-t border-gray-100 my-2" />

                <button
                  onClick={() => {
                    router.push('/sustainability');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-light text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  ← Back to Current Design
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal User Menu
function MinimalUserMenu({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-light text-gray-900 hover:text-gray-600 transition-colors"
      >
        <User className="w-4 h-4" />
        <span className="hidden md:inline">{user?.user_metadata?.name || 'User'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-20"
            >
              <div className="p-2">
                <button
                  onClick={() => {
                    router.push('/settings');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <div className="border-t border-gray-100 my-2" />

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-light text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SustainabilityLightPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('sustainability.overview');

  const { data: organizationData, isLoading: loading, error: queryError } = useOrganizationContext(!!user);

  const [selectedSite, setSelectedSite] = useState<Building | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    id: 'current-year',
    label: new Date().getFullYear().toString(),
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear()}-12-31`,
    type: 'year'
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) return;
      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      }
    }
    checkSuperAdmin();
  }, [user]);

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to connect to server') : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
          <p className="text-sm font-light text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-xl font-light text-gray-900">Error Loading</h3>
          <p className="text-sm font-light text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-sm font-light text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasFilters = selectedSite !== null || selectedPeriod.id !== 'current-year';

  return (
    <div className="bg-white min-h-screen">
      {/* MINIMAL STICKY HEADER - Pure white, ultra clean */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-light text-gray-900 tracking-tight">
                Sustainability
              </h1>
            </div>

            {/* Center: Filters */}
            <div className="flex items-center gap-6">
              <MinimalSiteSelector
                currentSite={selectedSite}
                onSiteChange={setSelectedSite}
              />

              <MinimalPeriodSelector
                currentPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />

              {hasFilters && (
                <button
                  onClick={() => {
                    setSelectedSite(null);
                    setSelectedPeriod({
                      id: 'current-year',
                      label: new Date().getFullYear().toString(),
                      start: `${new Date().getFullYear()}-01-01`,
                      end: `${new Date().getFullYear()}-12-31`,
                      type: 'year'
                    });
                  }}
                  className="text-sm font-light text-green-600 hover:text-green-700 underline transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Right: Navigation + User */}
            <div className="flex items-center gap-4">
              <MinimalNavMenu isSuperAdmin={isSuperAdmin} />
              <div className="w-px h-6 bg-gray-200" />
              <MinimalUserMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - MASSIVE padding, max-width container */}
      <main className="max-w-[1400px] mx-auto px-16 py-16">
        {organizationData && (
          <OverviewDashboardMinimal
            organizationId={organizationData.id}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
      </main>

      {/* Floating AI Chat */}
      {organizationData && <FloatingChat organizationId={organizationData.id} />}
    </div>
  );
}
