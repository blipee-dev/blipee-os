'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    // Check if there's a stored theme preference from the previous page
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDark(storedTheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  return (
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
        {/* Large 404 */}
        <div className={`text-[280px] font-bold leading-none -mt-12 ${
          isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
        }`}>
          404
        </div>

        {/* Message and button */}
        <div className="pt-20">
          <p className={`text-base mb-6 max-w-sm ${
            isDark ? 'text-[#FAFAFA]/80' : 'text-[#111111]'
          }`}>
            The page you were looking for doesn&apos;t exist. You may have mistyped the address or the page may have moved.
          </p>
          <Link
            href="/"
            className={`underline hover:no-underline text-base ${
              isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
            }`}
          >
            Go home
          </Link>
        </div>
      </div>

      {/* Large Home icon in bottom right */}
      <div className="absolute bottom-8 right-8">
        <div className={`w-[680px] h-[680px] p-[2px] rounded-[74px] ${
          isDark ? 'bg-[#FAFAFA]' : 'bg-[#111111]'
        }`}>
          <div className={`w-full h-full rounded-[72px] flex items-center justify-center ${
            isDark ? 'bg-[#111111]' : 'bg-white'
          }`}>
            <Home className={`w-[490px] h-[490px] ${
              isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
            }`} fill="none" strokeWidth="0.125" />
          </div>
        </div>
      </div>
    </div>
  );
}