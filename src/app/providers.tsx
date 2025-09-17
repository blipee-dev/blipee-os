'use client';

import { useEffect } from 'react';
import { AuthProvider } from "@/lib/auth/context";
import { initializeModuleSystem } from "@/lib/modules";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AppearanceProvider } from "@/providers/AppearanceProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { clearMalformedSupabaseCookies } from "@/lib/supabase/clear-cookies";
import { AuthTokenHandler } from "@/components/auth/AuthTokenHandler";

function ModuleSystemInitializer() {
  useEffect(() => {
    // Clear any malformed Supabase cookies
    clearMalformedSupabaseCookies();
    
    // Initialize the module system on client-side
    initializeModuleSystem();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppearanceProvider>
            <SettingsProvider>
              <ModuleSystemInitializer />
              <AuthTokenHandler />
              {children}
            </SettingsProvider>
          </AppearanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}