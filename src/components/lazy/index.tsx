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
export const LazyDynamicUIRenderer = dynamic(
  () => import('@/components/blipee-os/DynamicUIRenderer').then(mod => mod.DynamicUIRenderer),
  { 
    loading: Loading,
    ssr: false, // Disable SSR for dynamic UI components
  }
);

// Lazy load large dashboard components (80KB+ each)
export const LazyOverviewDashboard = dynamic(
  () => import('@/components/dashboard/OverviewDashboard').then(mod => mod.OverviewDashboard),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyOverviewDashboardWithScore = dynamic(
  () => import('@/components/dashboard/OverviewDashboardWithScore').then(mod => mod.OverviewDashboardWithScore),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyOverviewDashboardMinimal = dynamic(
  () => import('@/components/dashboard/OverviewDashboardMinimal').then(mod => mod.OverviewDashboardMinimal),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyEnergyDashboard = dynamic(
  () => import('@/components/dashboard/EnergyDashboard').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyWaterDashboard = dynamic(
  () => import('@/components/dashboard/WaterDashboard').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyWasteDashboard = dynamic(
  () => import('@/components/dashboard/WasteDashboard').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

export const LazyEmissionsDashboard = dynamic(
  () => import('@/components/dashboard/EmissionsDashboard').then(mod => mod.default),
  {
    loading: Loading,
    ssr: false,
  }
);

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