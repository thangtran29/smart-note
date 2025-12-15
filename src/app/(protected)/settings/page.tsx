import { Metadata } from 'next';
import { Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Smart Notes',
  description: 'Manage your application settings',
};

export default function SettingsPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Welcome to Settings
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Choose a category from the sidebar to manage your preferences
      </p>
    </div>
  );
}

