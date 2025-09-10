'use client';

import { useState } from 'react';
import { useLanguage, getLocaleInfo, SUPPORTED_LOCALES, type Locale } from '@/providers/LanguageProvider';
import { ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setIsOpen(false);
  }

  const currentLocaleInfo = getLocaleInfo(locale);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2.5 rounded-full bg-transparent hover:bg-white/[0.05] transition-colors flex items-center gap-2"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLocaleInfo.flag}</span>
        <span className="text-sm font-medium text-white hidden sm:inline">
          {currentLocaleInfo.name}
        </span>
        <ChevronDown className="w-4 h-4 text-white/70" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/[0.1] rounded-lg shadow-xl overflow-hidden z-50">
          {SUPPORTED_LOCALES.map((loc) => {
            const localeInfo = getLocaleInfo(loc);
            return (
              <button
                key={loc}
                onClick={() => changeLocale(loc)}
                disabled={loc === locale}
                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left ${
                  loc === locale ? 'opacity-50 cursor-not-allowed bg-white/[0.02]' : ''
                }`}
              >
                <span className="text-lg">{localeInfo.flag}</span>
                <span className="text-sm font-medium text-white">
                  {localeInfo.name}
                </span>
                {loc === locale && (
                  <span className="ml-auto text-xs text-purple-400">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}