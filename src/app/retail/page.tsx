import { Metadata } from 'next';
import { RetailDashboard } from '@/components/retail/dashboard/RetailDashboard';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const metadata: Metadata = {
  title: 'Retail Intelligence - blipee OS',
  description: 'AI-powered retail analytics and insights',
};

export default function RetailPage() {
  return (
    <ModuleLayout userPermissions={['retail:read', 'retail:analytics', 'sustainability:read']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Retail Intelligence
            </h1>
            <p className="text-gray-400 mt-2">
              AI-powered insights for your retail operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Module Active</span>
          </div>
        </div>
        
        <RetailDashboard />
      </div>
    </ModuleLayout>
  );
}