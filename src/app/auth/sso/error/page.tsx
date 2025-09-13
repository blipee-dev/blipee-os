'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Shield } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslations } from '@/providers/LanguageProvider';
import { Suspense } from 'react';

function SSOErrorContent() {
  const { theme } = useTheme();
  const t = useTranslations('errors.sso');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDark, setIsDark] = useState(theme === 'dark');
  
  const error = searchParams.get('error') || 'unknown_error';
  const description = searchParams.get('description') || 'An error occurred during SSO authentication';

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDark(storedTheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  const getErrorMessage = (errorCode: string) => {
    const errorKey = `errorCodes.${errorCode}`;
    return t(errorKey) || t('errorCodes.invalid_request');
  };

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
        {/* Large SSO symbol */}
        <div className={`text-[280px] font-bold leading-none -mt-12 ${
          isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
        }`}>
          🔐
        </div>

        {/* Message and buttons */}
        <div className="pt-20 max-w-lg">
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
          
          {/* Error details */}
          <div className={`p-4 mb-6 rounded-lg border ${
            isDark 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`text-sm font-medium mb-2 ${
              isDark ? 'text-red-100' : 'text-red-900'
            }`}>
              {t('authenticationError')}
            </h4>
            <p className={`text-sm mb-2 ${
              isDark ? 'text-red-300' : 'text-red-700'
            }`}>
              {getErrorMessage(error)}
            </p>
            {error !== 'unknown_error' && (
              <p className={`text-xs ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                Error code: {error}
              </p>
            )}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push('/signin')}
              className={`underline hover:no-underline text-base ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
              }`}
            >
              {t('backToSignIn')}
            </button>
            <button
              onClick={() => router.push('/signin')}
              className={`underline hover:no-underline text-base ${
                isDark ? 'text-[#FAFAFA]/80' : 'text-[#111111]/70'
              }`}
            >
              {t('tryDifferentMethod')}
            </button>
          </div>

          <p className={`text-sm ${
            isDark ? 'text-[#FAFAFA]/60' : 'text-[#111111]/60'
          }`}>
            {t('contactAdmin')}{' '}
            <a
              href="mailto:support@blipee.com"
              className={`underline hover:no-underline ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
              }`}
            >
              {t('supportTeam')}
            </a>
            .
          </p>
        </div>
      </div>

      {/* Large Shield icon in bottom right corner */}
      <div className="absolute bottom-16 right-16 pointer-events-none">
        <div className={`w-[680px] h-[680px] p-[2px] rounded-[74px] ${
          isDark ? 'bg-[#FAFAFA]' : 'bg-[#111111]'
        }`}>
          <div className={`w-full h-full rounded-[72px] flex items-center justify-center ${
            isDark ? 'bg-[#111111]' : 'bg-white'
          }`}>
            <Shield className={`w-[490px] h-[490px] ${
              isDark ? 'text-[#FAFAFA]' : 'text-[#111111]'
            }`} fill="none" strokeWidth="0.125" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SSOErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FAFAFA]"></div>
      </div>
    }>
      <SSOErrorContent />
    </Suspense>
  );
}