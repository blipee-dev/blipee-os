'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  locales, 
  localeNames, 
  localeFlags, 
  localeNativeName,
  type Locale 
} from '@/i18n';
import { useEnhancedTranslations } from '@/lib/i18n/utils';
import { ChevronDown, Globe, Check } from 'lucide-react';

interface AdvancedLanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

export function AdvancedLanguageSwitcher({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className = ''
}: AdvancedLanguageSwitcherProps) {
  const { t, locale } = useEnhancedTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Determine if we're on a locale-based route (marketing pages)
  const isLocaleRoute = pathname.startsWith(`/${locale}`);

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      if (isLocaleRoute) {
        // For marketing pages with locale routing
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
      } else {
        // For app pages, set preference and refresh
        document.cookie = `preferred-locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
        router.refresh();
      }
      setIsOpen(false);
    });
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
          aria-label={t('toggleLanguage')}
        >
          {showFlags && (
            <span className="text-sm">{localeFlags[locale]}</span>
          )}
          <span className="text-xs font-medium text-white/80 uppercase">
            {locale}
          </span>
          <ChevronDown className="w-3 h-3 text-white/60" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
            >
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending || loc === locale}
                  className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left ${
                    loc === locale ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {showFlags && (
                    <span className="text-sm">{localeFlags[loc]}</span>
                  )}
                  <span className="text-xs font-medium text-white whitespace-nowrap">
                    {showNativeNames ? localeNativeName[loc] : localeNames[loc]}
                  </span>
                  {loc === locale && (
                    <Check className="w-3 h-3 text-purple-400 ml-auto" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Language
          </span>
        </div>
        <div className="grid gap-1">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              disabled={isPending || loc === locale}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-left ${
                loc === locale
                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              {showFlags && (
                <span className="text-lg">{localeFlags[loc]}</span>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {localeNames[loc]}
                </div>
                {showNativeNames && localeNativeName[loc] !== localeNames[loc] && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {localeNativeName[loc]}
                  </div>
                )}
              </div>
              {loc === locale && (
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('toggleLanguage')}
      >
        {showFlags && (
          <span className="text-lg">{localeFlags[locale]}</span>
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {showNativeNames ? localeNativeName[locale] : localeNames[locale]}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
            >
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending || loc === locale}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    loc === locale ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  {showFlags && (
                    <span className="text-lg">{localeFlags[loc]}</span>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {localeNames[loc]}
                    </div>
                    {showNativeNames && localeNativeName[loc] !== localeNames[loc] && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {localeNativeName[loc]}
                      </div>
                    )}
                  </div>
                  {loc === locale && (
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                  {isPending && loc !== locale && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}