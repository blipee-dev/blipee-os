'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslations } from '@/providers/LanguageProvider';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen flex items-center justify-center relative transition-colors duration-300 bg-white dark:bg-[#111111]">
      {/* Logo in top left */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 p-0.5 rounded-xl bg-[#111111] dark:bg-[#FAFAFA]">
            <div className="w-full h-full rounded-[10px] flex items-center justify-center bg-white dark:bg-[#111111]">
              <Home className="w-6 h-6 text-[#111111] dark:text-[#FAFAFA]" fill="none" strokeWidth="2" />
            </div>
          </div>
          <span className="ml-3 text-xl font-normal text-[#111111] dark:text-[#FAFAFA]">
            {t('blipee')}
          </span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex items-start gap-24 relative z-10">
        {/* Large 404 */}
        <div className="text-[280px] font-bold leading-none -mt-12 text-[#111111] dark:text-[#FAFAFA]">
          {t('title')}
        </div>

        {/* Message and button */}
        <div className="pt-20">
          <p className="text-base mb-6 max-w-sm text-[#111111] dark:text-[#FAFAFA]/80">
            {t('message')}
          </p>
          <Link
            href="/"
            className="underline hover:no-underline text-base text-[#111111] dark:text-[#FAFAFA]"
          >
            {t('goHome')}
          </Link>
        </div>
      </div>

      {/* Large Home icon in bottom right */}
      <div className="absolute bottom-8 right-8">
        <div className="w-[680px] h-[680px] p-[2px] rounded-[74px] bg-[#111111] dark:bg-[#FAFAFA]">
          <div className="w-full h-full rounded-[72px] flex items-center justify-center bg-white dark:bg-[#111111]">
            <Home className="w-[490px] h-[490px] text-[#111111] dark:text-[#FAFAFA]" fill="none" strokeWidth="0.125" />
          </div>
        </div>
      </div>
    </div>
  );
}