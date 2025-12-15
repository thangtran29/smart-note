'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Tag, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

interface SettingsNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    href: '/settings/profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
  },
  {
    href: '/settings/tags',
    label: 'Tags',
    icon: <Tag className="h-4 w-4" />,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AppHeader currentPage="settings" />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your application settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {settingsNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

