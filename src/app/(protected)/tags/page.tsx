import { Metadata } from 'next';
import { TagManager } from '@/components/tags/tag-manager';
import { NoteBreadcrumb } from '@/components/notes/note-breadcrumb';

export const metadata: Metadata = {
  title: 'Tags | Smart Notes',
  description: 'Manage your tags for organizing notes',
};

export default function TagsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <NoteBreadcrumb items={[{ label: 'Tags' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage tags to organize your notes
          </p>
        </div>

        <TagManager />
      </div>
    </div>
  );
}
