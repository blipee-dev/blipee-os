'use client';

import React from 'react';
import FeaturesPageClient from '@/components/FeaturesPageClient';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FeaturesPage() {
  const { messages } = useLanguage();

  // Build the translations object that FeaturesPageClient expects
  const translations = {
    navigation: messages.navigation || {},
    features: messages.features || {},
    footer: messages.footer || {}
  };

  return <FeaturesPageClient translations={translations} />;
}