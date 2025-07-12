'use client';

import { useEffect } from 'react';
import { AuthProvider } from "@/lib/auth/context";
import { initializeModuleSystem } from "@/lib/modules";

function ModuleSystemInitializer() {
  useEffect(() => {
    // Initialize the module system on client-side
    initializeModuleSystem();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModuleSystemInitializer />
      {children}
    </AuthProvider>
  );
}