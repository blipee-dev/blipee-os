'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/providers/LanguageProvider';
import type { Building } from '@/types/auth';

interface SiteSelectorProps {
  currentSite: Building | null;
  onSiteChange: (site: Building | null) => void;
  className?: string;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({
  currentSite,
  onSiteChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sites, setSites] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const t = useTranslations('common.filters.siteSelector');

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
      } finally {
        setLoading(false);
      }
    };

    if (session?.current_organization) {
      loadSites();
    }
  }, [session?.current_organization]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
      </div>
    );
  }

  const displayLabel = currentSite ? currentSite.name : t('allSites');

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
      >
        <Building2 className="w-4 h-4 text-gray-500 dark:text-white/70" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-white/70 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl shadow-lg z-20"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-white/50 px-3 py-2 mb-1">
                  {t('siteFilter')}
                </div>

                {/* All Sites Option */}
                <button
                  onClick={() => {
                    onSiteChange(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                    !currentSite
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{t('allSites')}</div>
                    <div className="text-xs text-gray-500 dark:text-white/50">
                      {t('organizationWide')}
                    </div>
                  </div>
                </button>

                {/* Divider */}
                {sites.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-white/[0.05] my-2" />
                )}

                {/* Individual Sites */}
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      onSiteChange(site);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                      currentSite?.id === site.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{site.name}</div>
                      <div className="text-xs text-gray-500 dark:text-white/50">
                        {site.city || t('noLocation')}
                        {site.size_sqm ? ` • ${Math.round(site.size_sqm).toLocaleString()} m²` : ''}
                      </div>
                    </div>
                  </button>
                ))}

                {/* No sites message */}
                {sites.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-white/50">
                    {t('noSitesFound')}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
