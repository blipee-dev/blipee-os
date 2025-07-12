'use client';

import { ReactNode } from 'react';
import { NavRail } from '@/components/navigation/NavRail';
import { ModuleNavigation } from '@/components/navigation/ModuleNavigation';

interface ModuleLayoutProps {
  children: ReactNode;
  userPermissions?: string[];
  showModuleNav?: boolean;
}

export function ModuleLayout({ 
  children, 
  userPermissions = ['sustainability:read', 'retail:read', 'retail:analytics'], 
  showModuleNav = true 
}: ModuleLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation Rail */}
      <NavRail />
      
      {/* Main Content Area */}
      <div className="ml-20 flex">
        {/* Module Navigation Sidebar */}
        {showModuleNav && (
          <div className="w-64 min-h-screen p-4">
            <ModuleNavigation userPermissions={userPermissions} />
          </div>
        )}
        
        {/* Content */}
        <main className={`flex-1 min-h-screen ${showModuleNav ? 'p-6' : 'p-8'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}