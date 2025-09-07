'use client';

import { useEffect } from 'react';
import { AuthProvider } from "@/lib/auth/context";
import { initializeModuleSystem } from "@/lib/modules";
import { ThemeProvider } from "@/providers/ThemeProvider";

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
        <ModuleSystemInitializer />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}