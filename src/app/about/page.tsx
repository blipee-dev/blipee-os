'use client';

import React from 'react';
import AboutPageClient from '@/components/AboutPageClient';
import { useLanguage } from '@/providers/LanguageProvider';

export default function AboutPage() {
  const { messages } = useLanguage();

  // Build the translations object that AboutPageClient expects
  const translations = {
    navigation: messages.navigation || {},
    about: messages.about || {},
    footer: messages.footer || {}
  };

  return <AboutPageClient translations={translations} />;
}
