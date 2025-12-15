'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NoteToolbar } from '@/components/notes/note-toolbar';
import { DeleteNoteDialog } from '@/components/notes/delete-note-dialog';
import { NoteBreadcrumb } from '@/components/notes/note-breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagSelector } from '@/components/tags/tag-selector';
import { NoteExpirationSelector } from '@/components/notes/note-expiration-selector';
import { updateNoteWithTags } from '@/lib/notes/actions';
import { AIChatButton } from '@/components/ai-chat/ai-chat-button';
import { AIChatPanel } from '@/components/ai-chat/ai-chat-panel';
import { LogoutButton } from '@/components/auth/logout-button';
import type { EditorJSContent } from '@/lib/notes/types';
import type { Note } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import type { NoteEditorRef } from '@/components/notes/note-editor';
import { getConversationHistory } from '@/lib/ai-chat/client';

// Types for the joined data from Supabase
interface NoteTagJoin {
  tags: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface NoteWithTags extends Note {
  note_tags: NoteTagJoin[] | null;
  expires_at: string | null;
}

const NoteEditor = dynamic(
  () => import('@/components/notes/note-editor').then((mod) => mod.NoteEditor),
  { ssr: false, loading: () => <div className="min-h-[300px] border rounded-md p-4 animate-pulse bg-gray-100" /> }
);

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<EditorJSContent | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [hasChatContent, setHasChatContent] = useState(false);
  const editorRef = useRef<NoteEditorRef>(null);

  // Load note on mount
  useEffect(() => {
    async function loadNote() {
      setIsLoading(true);
      const supabase = createClient();

      const { data: fetchedNote, error: fetchError } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags(
            tags(*)
          )
        `)
        .eq('id', noteId)
        .single();

      if (fetchError || !fetchedNote) {
        router.push('/notes');
        return;
      }

      const noteData = fetchedNote as NoteWithTags;
      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content);
      
      // Set expiration date if it exists
      if (noteData.expires_at) {
        setExpiresAt(new Date(noteData.expires_at));
      } else {
        setExpiresAt(null);
      }

      // Extract tag IDs from the loaded note
      const tagIds = (noteData.note_tags || [])
        .map((nt: NoteTagJoin) => nt.tags?.id)
        .filter((id): id is string => Boolean(id));
      setSelectedTagIds(tagIds);

      // Check if note has chat content
      try {
        const conversations = await getConversationHistory(noteId);
        const hasContent = conversations.length > 0;
        setHasChatContent(hasContent);
        // Auto-open chat box if it has content
        if (hasContent) {
          setShowAIChat(true);
        }
      } catch (err) {
        console.error('Failed to check conversation history:', err);
        setHasChatContent(false);
      }

      setIsLoading(false);
    }

    loadNote();
  }, [noteId, router]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(
    async (newTitle: string, newContent: EditorJSContent | null, newTagIds?: string[], newExpiresAt?: Date | null) => {
      if (!noteId) return;

      setSaveStatus('saving');

      try {
        const result = await updateNoteWithTags(noteId, {
          title: newTitle,
          content: newContent ?? undefined,
          tagIds: newTagIds,
          expires_at: newExpiresAt,
        });

        if (result.success) {
          setSaveStatus('saved');
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          setError(result.error);
        }
      } catch {
        setSaveStatus('error');
        setError('Failed to save');
      }
    },
    2000
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    debouncedSave(newTitle, content, selectedTagIds, expiresAt);
  }, [content, selectedTagIds, expiresAt, debouncedSave]);

  const handleContentChange = useCallback((newContent: EditorJSContent) => {
    setContent(newContent);
    debouncedSave(title, newContent, selectedTagIds, expiresAt);
  }, [title, selectedTagIds, expiresAt, debouncedSave]);

  const handleExpirationChange = useCallback((newExpiresAt: Date | null) => {
    setExpiresAt(newExpiresAt);
    debouncedSave(title, content, selectedTagIds, newExpiresAt);
  }, [title, content, selectedTagIds, debouncedSave]);

  const handleManualSave = async () => {
    if (!noteId) return;

    setSaveStatus('saving');

    try {
      const result = await updateNoteWithTags(noteId, {
        title,
        content: content ?? undefined,
        tagIds: selectedTagIds,
        expires_at: expiresAt,
      });

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setError(result.error);
      }
    } catch {
      setSaveStatus('error');
      setError('Failed to save');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-[300px] bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Notes
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/notes">
              <Button variant="outline" size="sm">
                My Notes
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <NoteBreadcrumb 
          items={[
            { label: 'Notes', href: '/notes' }, 
            { label: title || 'Untitled' }
          ]} 
        />
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/notes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
            <NoteToolbar 
              onSave={handleManualSave} 
              isSaving={saveStatus === 'saving'}
              saveStatus={saveStatus}
              showDelete={true}
              onDelete={() => setShowDeleteDialog(true)}
            />
            {hasChatContent && (
              <AIChatButton
                onClick={() => setShowAIChat(!showAIChat)}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        <DeleteNoteDialog
          noteId={noteId}
          noteTitle={title}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />

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
            onChange={(e) => handleTitleChange(e.target.value)}
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
              onChange={handleExpirationChange}
            />
          </div>

          <NoteEditor
            ref={editorRef}
            initialContent={note.content}
            onChange={handleContentChange}
          />
        </div>

        {/* AI Chat Panel */}
        {showAIChat && (
          <div className="mt-8">
            <AIChatPanel
              noteId={noteId}
              onClose={() => setShowAIChat(false)}
              onInsertMessage={(message) => {
                editorRef.current?.appendText(message);
              }}
              onConversationCreated={() => {
                // Update hasChatContent when a new conversation is created
                setHasChatContent(true);
              }}
              onHistoryCleared={() => {
                // Update hasChatContent when history is cleared
                setHasChatContent(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
