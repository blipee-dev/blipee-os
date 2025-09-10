'use client';

import React from 'react';
import IndustriesPageClient from '@/components/IndustriesPageClient';
import { useLanguage } from '@/providers/LanguageProvider';

export default function IndustriesPage() {
  const { messages } = useLanguage();

  // Build the translations object that IndustriesPageClient expects
  const translations = {
    navigation: messages.navigation || {},
    industries: messages.industries || {},
    footer: messages.footer || {}
  };

  return <IndustriesPageClient translations={translations} />;
}