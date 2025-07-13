'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
 
  ShoppingBag, 
  Building, 
  Shield, 
  BarChart3, 
  Settings,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { moduleRegistry } from '@/lib/modules/registry';
import { Module } from '@/lib/modules/types';

// Icon mapping for modules
const getModuleIcon = (iconName: string) => {
  const icons = {

    ShoppingBag,
    Building,
    Shield,
    BarChart3,
    Settings,
  };
  return icons[iconName as keyof typeof icons] || BarChart3;
};

interface ModuleNavigationProps {
  userPermissions?: string[];
  className?: string;
}

export function ModuleNavigation({ userPermissions = [], className = '' }: ModuleNavigationProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    // Get available modules for user
    const availableModules = moduleRegistry.getActiveModules().filter(module => {
      // Mock context for now - in real app this would come from auth
      const context = {
        user: {},
        organization: {},
        permissions: userPermissions,
        features: []
      };
      return moduleRegistry.isModuleAvailable(module.id, context);
    });

    setModules(availableModules);

    // Auto-expand current category
    const currentModule = availableModules.find(m => pathname.startsWith(m.path));
    if (currentModule) {
      setExpandedCategories(prev => new Set(Array.from(prev).concat(currentModule.category)));
    }
  }, [userPermissions, pathname]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const categoryLabels = {
    sustainability: 'Sustainability',
    retail: 'Retail Intelligence',
    ai: 'AI & Analytics',
    compliance: 'Compliance',
    analytics: 'Analytics'
  };

  return (
    <nav className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Modules</h3>
        
        <div className="space-y-2">
          {Object.entries(modulesByCategory).map(([category, categoryModules]) => {
            const isExpanded = expandedCategories.has(category);
            const label = categoryLabels[category as keyof typeof categoryLabels] || category;

            return (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  <span className="capitalize">{label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Module Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoryModules.map((module) => {
                      const IconComponent = getModuleIcon(module.icon);
                      const isActive = pathname.startsWith(module.path);

                      return (
                        <Link
                          key={module.id}
                          href={module.path}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                            isActive
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <IconComponent className={`h-4 w-4 mr-3 ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                          <span className="flex-1">{module.name}</span>
                          
                          {/* Status indicator */}
                          <div className={`h-2 w-2 rounded-full ${
                            module.status === 'active' ? 'bg-green-500' :
                            module.status === 'maintenance' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Module Status Summary */}
        {modules.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="text-xs text-gray-500">
              {modules.length} module{modules.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex items-center mt-1 space-x-2">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Maintenance</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Inactive</span>
              </div>
            </div>
          </div>
        )}

        {/* Debug info in development */}
        {process.env['NODE_ENV'] === 'development' && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <details className="text-xs">
              <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
              <div className="mt-2 text-gray-400">
                <div>Current path: {pathname}</div>
                <div>User permissions: {userPermissions.join(', ') || 'none'}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </nav>
  );
}