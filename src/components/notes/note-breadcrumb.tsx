import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NoteBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function NoteBreadcrumb({ items }: NoteBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
      <Link 
        href="/notes" 
        className="hover:text-gray-700 dark:hover:text-gray-200 flex items-center"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-gray-700 dark:hover:text-gray-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
