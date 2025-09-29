import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Use the comprehensive emissions component with all features
const EmissionsClient = dynamic(
  () => import('./EmissionsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading emissions analysis...</div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'Emissions Analysis | Blipee OS',
  description: 'Advanced emissions tracking with ML-powered forecasting',
};

export default function EmissionsPage() {
  return <EmissionsClient />;
}