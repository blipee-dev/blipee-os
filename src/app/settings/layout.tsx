'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlassCard } from '@/components/premium/GlassCard';
import {
  User,
  Shield,
  Key,
  Building2,
  Users,
  CreditCard,
  Activity,
  Bell,
  Code,
  BarChart3,
  Zap,
  Database,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
  },
  {
    title: 'API Usage',
    href: '/settings/api-usage',
    icon: BarChart3,
  },
  {
    title: 'SSO Configuration',
    href: '/settings/sso',
    icon: Code,
  },
  {
    title: 'Webhooks',
    href: '/settings/webhooks',
    icon: Zap,
  },
  {
    title: 'GraphQL Playground',
    href: '/graphql-playground',
    icon: Database,
  },
  {
    title: 'Organization',
    href: '/settings/organization',
    icon: Building2,
  },
  {
    title: 'Team',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    icon: Activity,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <GlassCard className="sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </GlassCard>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}