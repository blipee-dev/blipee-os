'use client';

import { useEffect } from 'react';
import { AuthProvider } from "@/lib/auth/context";
import { initializeModuleSystem } from "@/lib/modules";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";

function ModuleSystemInitializer() {
  useEffect(() => {
    // Initialize the module system on client-side
    initializeModuleSystem();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <ModuleSystemInitializer />
          {children}
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}