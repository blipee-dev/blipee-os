'use client';

import React from 'react';
import AITechnologyPageClient from '@/components/AITechnologyPageClient';
import { useLanguage } from '@/providers/LanguageProvider';

export default function AITechnologyPage() {
  const { messages } = useLanguage();

  // Build the translations object that AITechnologyPageClient expects
  const translations = {
    navigation: messages.navigation || {},
    aiTechnology: messages.aiTechnology || {},
    cta: messages.cta || {},
    footer: messages.footer || {},
    modals: messages.modals || {}
  };

  return <AITechnologyPageClient translations={translations} />;
}