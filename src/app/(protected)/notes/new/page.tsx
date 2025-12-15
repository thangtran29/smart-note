'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { NoteToolbar } from '@/components/notes/note-toolbar';
import { NoteBreadcrumb } from '@/components/notes/note-breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createNoteWithTags } from '@/lib/notes/actions';
import { TagSelector } from '@/components/tags/tag-selector';
import { NoteExpirationSelector } from '@/components/notes/note-expiration-selector';
import type { EditorJSContent } from '@/lib/notes/types';

const NoteEditor = dynamic(
  () => import('@/components/notes/note-editor').then((mod) => mod.NoteEditor),
  { ssr: false, loading: () => <div className="min-h-[300px] border rounded-md p-4 animate-pulse bg-gray-100" /> }
);

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<EditorJSContent | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContentChange = useCallback((newContent: EditorJSContent) => {
    setContent(newContent);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await createNoteWithTags({
        title: title || undefined,
        content: content || undefined,
        tagIds: selectedTagIds,
        expires_at: expiresAt,
      });

      if (result.success) {
        router.push(`/notes/${result.note.id}`);
      } else {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <NoteBreadcrumb items={[{ label: 'Notes', href: '/notes' }, { label: 'New Note' }]} />
        
        <div className="mb-6">
          <NoteToolbar onSave={handleSave} isSaving={isSaving} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
          />

          <div className="max-w-md">
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              placeholder="Select tags for your note..."
            />
          </div>

          <div className="max-w-md">
            <NoteExpirationSelector
              expiresAt={expiresAt}
              onChange={setExpiresAt}
            />
          </div>

          <NoteEditor onChange={handleContentChange} />
        </div>
      </div>
    </div>
  );
}
