import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { ConversationInterface } from '@/components/ConversationInterface';

export default function DashboardPage() {
  return (
    <ModuleLayout userPermissions={['sustainability:read', 'retail:read']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sustainability Intelligence
            </h1>
            <p className="text-gray-400 mt-2">
              Your AI-powered sustainability assistant
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">AI Online</span>
          </div>
        </div>
        
        <ConversationInterface />
      </div>
    </ModuleLayout>
  );
}