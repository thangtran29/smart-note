'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, ChevronDown, ChevronUp, Settings } from 'lucide-react';
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
import type { NoteEditorRef } from '@/lib/notes/types';
import { getConversationHistory } from '@/lib/ai-chat/client';
import { NotePasswordToggle } from '@/components/notes/note-password-toggle';
import { NotePasswordDialog } from '@/components/notes/note-password-dialog';
import { NoteVariantManager } from '@/components/notes/note-variant-manager';
import { getNoteVariants } from '@/lib/notes/client-queries';

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
  const [isProtected, setIsProtected] = useState(false);
  const [hasVariants, setHasVariants] = useState(false); // Track if variants exist
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<EditorJSContent | null>(null);
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState<string | null>(null); // Temporary, cleared on lock
  const [showOptions, setShowOptions] = useState(false); // Toggle for tags/expiration
  const [showMainContent, setShowMainContent] = useState(true); // Toggle for main content when viewing variants
  const [showVariantManager, setShowVariantManager] = useState(false); // Toggle for variant manager (default: hidden)
  const editorRef = useRef<NoteEditorRef>(null);

  // Clear decrypted content and password from memory on tab blur/refresh
  useEffect(() => {
    const handleBlur = () => {
      if (isProtected && isUnlocked) {
        setDecryptedContent(null);
        setContent(null);
        setIsUnlocked(false);
        setUnlockPassword(null); // Clear password
        setCurrentVariantId(null);
      }
    };

    const handleBeforeUnload = () => {
      if (isProtected && isUnlocked) {
        setDecryptedContent(null);
        setContent(null);
        setIsUnlocked(false);
        setUnlockPassword(null); // Clear password
        setCurrentVariantId(null);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProtected, isUnlocked]);

  // Load note on mount
  useEffect(() => {
    async function loadNote() {
      setIsLoading(true);

      try {
        // First get the note
        const noteResponse = await fetch(`/api/notes/${noteId}`);
        if (!noteResponse.ok) {
          router.push('/notes');
          return;
        }
        const noteData = await noteResponse.json();
        const fetchedNote = noteData.note as NoteWithTags;

        // Then get tags (we'll need to create an API for this or include in note response)
        // For now, let's get tags separately
        const tagsResponse = await fetch(`/api/notes/${noteId}/tags`);
        const tagsData = tagsResponse.ok ? await tagsResponse.json() : { tags: [] };
        
        const noteDataWithTags = {
          ...fetchedNote,
          note_tags: tagsData.tags || [],
        } as NoteWithTags;
        
        setNote(noteDataWithTags);
        setTitle(noteDataWithTags.title);
        setContent(noteDataWithTags.content);
        
        // Set expiration date if it exists
        if (noteDataWithTags.expires_at) {
          setExpiresAt(new Date(noteDataWithTags.expires_at));
        } else {
          setExpiresAt(null);
        }

        // Extract tag IDs from the loaded note
        const tagIds = (noteDataWithTags.note_tags || [])
          .map((nt: NoteTagJoin) => nt.tags?.id)
          .filter((id): id is string => Boolean(id));
        setSelectedTagIds(tagIds);
      } catch (error) {
        console.error('Error loading note:', error);
        router.push('/notes');
        return;
      } finally {
        setIsLoading(false);
      }

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

      // Check if note has variants (variants are separate from note content)
      // Note content is always visible, variants are password-protected
      try {
        const variantsResult = await getNoteVariants(noteId);
        if (variantsResult.success && variantsResult.variants.length > 0) {
          // Has variants - but note content is still visible
          setIsProtected(true); // Track that variants exist
          setHasVariants(true); // Track that variants exist for button display
        } else {
          setHasVariants(false);
          // Keep isProtected true if user just enabled it (will be set by onProtectionEnabled)
        }
        // Note content is already set above and is always unlocked
        setIsUnlocked(true); // Note content is always unlocked
        setDecryptedContent(null);
      } catch (err) {
        console.error('Failed to check variants:', err);
        setHasVariants(false);
        setIsUnlocked(true);
        setDecryptedContent(null);
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
        // Update note (title, content, tags, expiration)
        // Note: Variants are separate and saved independently
        // Note content is always saved normally (not encrypted)
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
      } catch (err) {
        console.error('Error saving note:', err);
        setSaveStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to save');
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
      // Update note (title, content, tags, expiration)
      // Note content is always saved normally (not encrypted)
      // Variants are saved separately through the variant manager
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
    } catch (err) {
      console.error('Error saving note:', err);
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
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
            {hasChatContent && (
              <AIChatButton
                onClick={() => setShowAIChat(!showAIChat)}
                disabled={isLoading}
              />
            )}
          </div>
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

          {/* Options toggle button */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Options
              {showOptions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Collapsible options section */}
          {showOptions && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
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
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <NotePasswordToggle
                noteId={noteId}
                content={content || decryptedContent}
                isProtected={isProtected}
                currentVariantId={currentVariantId}
                onProtectionEnabled={() => {
                  setIsProtected(true);
                  setShowVariantManager(true); // Show variant manager when protection is enabled
                  // When protection is enabled, don't require password - just show variant manager
                  setIsUnlocked(true);
                  setShowPasswordDialog(false);
                }}
                onPasswordChanged={() => {
                  // Password changed - user may need to unlock again
                  setIsUnlocked(false);
                  setDecryptedContent(null);
                  setContent(null);
                  setUnlockPassword(null);
                  setCurrentVariantId(null);
                }}
              />
              {isProtected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariantManager(!showVariantManager)}
                  className="flex items-center gap-2"
                >
                  {showVariantManager ? (
                    <>
                      Hide Variant Manager
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show Variant Manager
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {isProtected && showVariantManager && (
              <NoteVariantManager
                noteId={noteId}
                content={content || decryptedContent}
                hasVariants={hasVariants}
                onViewVariants={() => setShowPasswordDialog(true)}
                onVariantAdded={() => {
                  // Variant added - refresh state
                  getNoteVariants(noteId).then((result) => {
                    if (result.success && result.variants.length > 0) {
                      setHasVariants(true);
                    }
                  });
                }}
                onVariantDeleted={() => {
                  // Variant deleted - check if we need to unlock again
                  if (currentVariantId) {
                    // Check if current variant still exists
                    getNoteVariants(noteId).then((result) => {
                      if (result.success) {
                        const stillExists = result.variants.some(v => v.id === currentVariantId);
                        if (!stillExists) {
                          setIsUnlocked(false);
                          setDecryptedContent(null);
                          setContent(null);
                          setUnlockPassword(null);
                          setCurrentVariantId(null);
                        }
                        // Update hasVariants based on remaining variants
                        setHasVariants(result.variants.length > 0);
                      }
                    });
                  } else {
                    // Check if any variants remain
                    getNoteVariants(noteId).then((result) => {
                      if (result.success) {
                        setHasVariants(result.variants.length > 0);
                      }
                    });
                  }
                }}
                onProtectionDisabled={() => {
                  setIsProtected(false);
                  setHasVariants(false);
                  setIsUnlocked(true);
                  setDecryptedContent(null);
                  setContent(note?.content || null);
                  setUnlockPassword(null);
                  setCurrentVariantId(null);
                }}
              />
            )}
          </div>

          {/* Note content - can be collapsed when viewing variants */}
          <div className="space-y-2">
            {decryptedContent && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Main Note Content
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMainContent(!showMainContent)}
                  className="flex items-center gap-1"
                >
                  {showMainContent ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            )}
            {showMainContent && (
              <NoteEditor
                ref={editorRef}
                initialContent={content || note?.content || null}
                onChange={handleContentChange}
                readOnly={false}
              />
            )}
          </div>

          {/* Variants section - password protected */}
          {isProtected && (
            <div className="mt-6 border-t pt-6">
              {decryptedContent && (
                <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentVariantId ? 'Unlocked Variant Content' : 'Variant Content'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDecryptedContent(null);
                        setCurrentVariantId(null);
                        setUnlockPassword(null);
                        setShowMainContent(true); // Show main content when closing variant
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="border rounded-md p-4 bg-white dark:bg-gray-950 min-h-[200px]">
                    <NoteEditor
                      initialContent={decryptedContent}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <NotePasswordDialog
            noteId={noteId}
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            onUnlock={(unlockedContent, variantId, password) => {
              // Show variant content separately - don't replace note content
              // If variantId is undefined, it means decryption failed and we're showing fake content
              // In that case, still show it but don't store password or variant ID
              setDecryptedContent(unlockedContent);
              setShowPasswordDialog(false);
              setShowMainContent(false); // Collapse main content when viewing variant
              if (variantId) {
                setCurrentVariantId(variantId);
                // Only store password if we have a valid variant (real decryption succeeded)
                if (password) {
                  setUnlockPassword(password);
                }
              } else {
                // Fake content - don't set variant ID or password
                setCurrentVariantId(null);
                setUnlockPassword(null);
              }
            }}
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
