'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Zap } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslations } from '@/providers/LanguageProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { theme } = useTheme();
  const t = useTranslations('errors.global');
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDark(storedTheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  return (
    <html>
      <body>
        <div className={`min-h-screen flex items-center justify-center relative transition-colors duration-300 ${
          isDark ? 'bg-[#111111]' : 'bg-white'
        }`}>
          {/* Logo in top left */}
          <div className="absolute top-8 left-8">
            <Link href="/" className="flex items-center">
              <div className={`w-10 h-10 p-0.5 rounded-xl ${
                isDark ? 'bg-[#FAFAFA]' : 'bg-[#111111]'
              }`}>
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isDark ? 'bg-[#111111]' : 'bg-white'
                }`}>
                  <Home className={`w-6 h-6 ${
                    isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
                  }`} fill="none" strokeWidth="2" />
                </div>
              </div>
              <span className={`ml-3 text-xl font-normal ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
              }`}>
                blipee
              </span>
            </Link>
          </div>

          {/* Main content */}
          <div className="flex items-start gap-24 relative z-10">
            {/* Large Error symbol */}
            <div className={`text-[280px] font-bold leading-none -mt-12 ${
              isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
            }`}>
              ⚡
            </div>

            {/* Message and buttons */}
            <div className="pt-20">
              <h2 className={`text-2xl font-bold mb-2 ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
              }`}>
                {t('title')}
              </h2>
              <h3 className={`text-lg mb-4 ${
                isDark ? 'text-[#FAFAFA]/80' : 'text-[#111111]/70'
              }`}>
                {t('subtitle')}
              </h3>
              <p className={`text-base mb-6 max-w-sm ${
                isDark ? 'text-[#FAFAFA]/80' : 'text-[#111111]'
              }`}>
                {t('description')}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className={`underline hover:no-underline text-base ${
                    isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
                  }`}
                >
                  {t('tryAgain')}
                </button>
                <Link
                  href="/"
                  className={`underline hover:no-underline text-base ${
                    isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
                  }`}
                >
                  {t('goHome')}
                </Link>
              </div>
            </div>
          </div>

          {/* Large Zap icon in bottom right corner */}
          <div className="absolute bottom-16 right-16 pointer-events-none">
            <div className={`w-[680px] h-[680px] p-[2px] rounded-[74px] ${
              isDark ? 'bg-[#FAFAFA]' : 'bg-[#111111]'
            }`}>
              <div className={`w-full h-full rounded-[72px] flex items-center justify-center ${
                isDark ? 'bg-[#111111]' : 'bg-white'
              }`}>
                <Zap className={`w-[490px] h-[490px] ${
                  isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
                }`} fill="none" strokeWidth="0.125" />
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}