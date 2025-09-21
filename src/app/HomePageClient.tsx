'use client';

import React from 'react';
import LandingPageClient from '@/components/LandingPageClient';
import { useLanguage } from '@/providers/LanguageProvider';

export default function HomePageClient() {
  const { messages } = useLanguage();

  // Build the translations object that LandingPageClient expects
  const translations = {
    navigation: messages.navigation || {},
    hero: {
      ...(messages.hero || {}),
      // Map the CTA buttons correctly
      signInToDashboard: messages.hero?.cta?.signInToDashboard || 'Sign In to Dashboard',
      requestAccess: messages.hero?.cta?.requestAccess || 'Request Access'
    },
    landing: messages.landing || {},
    footer: messages.footer || {}
  };

  return <LandingPageClient translations={translations} />;
}