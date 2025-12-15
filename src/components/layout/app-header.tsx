'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';
import { Menu, X, FileText, Sparkles, Settings } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface AppHeaderProps {
  currentPage?: 'notes' | 'insights' | 'settings';
}

export function AppHeader({ currentPage }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: '/notes',
      label: 'My Notes',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: '/insights',
      label: 'AI Insights',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/notes" className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Notes
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline" size="sm">
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </Link>
            ))}
            <LogoutButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMobileMenu}
            />
            {/* Menu Panel */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMobileMenu}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Menu Items */}
                <div className="flex flex-col p-4 gap-2 flex-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="w-full"
                    >
                      <Button
                        variant={
                          (currentPage === 'notes' && item.href === '/notes') ||
                          (currentPage === 'insights' && item.href === '/insights') ||
                          (currentPage === 'settings' && item.href.startsWith('/settings'))
                            ? 'default'
                            : 'ghost'
                        }
                        className="w-full justify-start"
                        size="sm"
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                  <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                    <LogoutButton className="w-full justify-start" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

