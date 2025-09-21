import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component
const Loading = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
    </div>
  );
};

// Lazy load heavy components
export const LazyConversationInterface = dynamic(
  () => import('@/components/blipee-os/ConversationInterface').then(mod => mod.ConversationInterface),
  { 
    loading: Loading,
    ssr: true,
  }
);

export const LazyDynamicUIRenderer = dynamic(
  () => import('@/components/blipee-os/DynamicUIRenderer').then(mod => mod.DynamicUIRenderer),
  { 
    loading: Loading,
    ssr: false, // Disable SSR for dynamic UI components
  }
);

// These components can be added when they exist
// export const LazyBuildingDashboard = dynamic(
//   () => import('@/components/dynamic/BuildingDashboard').then(mod => mod.default),
//   { 
//     loading: Loading,
//     ssr: false,
//   }
// );

// export const LazyEnergyChart = dynamic(
//   () => import('@/components/dynamic/EnergyChart').then(mod => mod.default),
//   { 
//     loading: Loading,
//     ssr: false,
//   }
// );

export const LazyMonitoringDashboard = dynamic(
  () => import('@/app/settings/monitoring/MonitoringClient').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyPerformanceDashboard = dynamic(
  () => import('@/app/settings/performance/PerformanceClient').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

// Utility function to preload components
export const preloadComponent = (component: ComponentType<any>) => {
  if ('preload' in component && typeof component.preload === 'function') {
    component.preload();
  }
};

// Preload critical components on hover
export const preloadOnHover = (component: ComponentType<any>) => {
  return {
    onMouseEnter: () => preloadComponent(component),
    onTouchStart: () => preloadComponent(component),
  };
};