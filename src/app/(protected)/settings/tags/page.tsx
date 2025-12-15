import { Metadata } from 'next';
import { TagManager } from '@/components/tags/tag-manager';

export const metadata: Metadata = {
  title: 'Tags | Settings | Smart Notes',
  description: 'Manage your tags for organizing notes',
};

export default function TagsSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tags
        </h2>
        <p className="text-muted-foreground mt-2">
          Create and manage tags to organize your notes
        </p>
      </div>
      <TagManager />
    </div>
  );
}

