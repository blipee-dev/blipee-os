'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';
import { ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  function changeLocale(nextLocale: Locale) {
    startTransition(() => {
      // Remove the current locale from the pathname
      const segments = pathname.split('/');
      const localeIndex = segments.findIndex(segment => locales.includes(segment as Locale));
      
      if (localeIndex !== -1) {
        segments[localeIndex] = nextLocale;
      } else {
        // If no locale in path, add it at the beginning
        segments.unshift(nextLocale);
      }
      
      const newPath = segments.filter(Boolean).join('/');
      router.replace(`/${newPath}`);
      setIsOpen(false);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="px-3 py-2.5 rounded-full bg-transparent hover:bg-white/[0.05] transition-colors flex items-center gap-2"
        aria-label="Change language"
      >
        <span className="text-lg">{localeFlags[locale]}</span>
        <span className="text-sm font-medium text-white hidden sm:inline">
          {localeNames[locale]}
        </span>
        <ChevronDown className="w-4 h-4 text-white/70" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/[0.1] rounded-lg shadow-xl overflow-hidden z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => changeLocale(loc)}
              disabled={isPending || loc === locale}
              className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left ${
                loc === locale ? 'opacity-50 cursor-not-allowed bg-white/[0.02]' : ''
              }`}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span className="text-sm font-medium text-white">
                {localeNames[loc]}
              </span>
              {loc === locale && (
                <span className="ml-auto text-xs text-purple-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}