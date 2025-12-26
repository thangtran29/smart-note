'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Lock, Plus, Trash2, Loader2, X } from 'lucide-react';
import { addPasswordVariant, deletePasswordVariant, disablePasswordProtection } from '@/lib/notes/actions';
import { encryptNoteContent, uint8ArrayToHex } from '@/lib/notes/encryption/variant-manager';
import { getNoteVariants } from '@/lib/notes/client-queries';
import type { EditorJSContent } from '@/lib/notes/types';
import type { NoteEncryptionVariant } from '@/lib/notes/encryption/types';

// Dynamically import NoteEditor to prevent SSR issues
const NoteEditor = dynamic(
  () => import('@/components/notes/note-editor').then((mod) => mod.NoteEditor),
  { ssr: false, loading: () => <div className="min-h-[300px] border rounded-md p-4 animate-pulse bg-gray-100" /> }
);

interface NoteVariantManagerProps {
  noteId: string;
  content: EditorJSContent | null;
  hasVariants?: boolean;
  onVariantAdded?: () => void;
  onVariantDeleted?: () => void;
  onProtectionDisabled?: () => void;
  onViewVariants?: () => void;
}

export function NoteVariantManager({
  noteId,
  content,
  hasVariants = false,
  onVariantAdded,
  onVariantDeleted,
  onProtectionDisabled,
  onViewVariants,
}: NoteVariantManagerProps) {
  const [variants, setVariants] = useState<NoteEncryptionVariant[]>([]);
  const [realVariantCount, setRealVariantCount] = useState(0); // Track real variant count (not including fake)
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [variantContent, setVariantContent] = useState<EditorJSContent | null>(content);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load variants - use server action to get only real variants (no fake ones)
  useEffect(() => {
    async function loadVariants() {
      setIsLoading(true);
      try {
        // Fetch variants for manager (only real variants, no fake ones)
        const response = await fetch(`/api/notes/${noteId}/variants?for=manager`);
        if (!response.ok) {
          console.error('Error fetching variants for manager');
          return;
        }
        const data = await response.json();
        if (data.success) {
          setVariants(data.variants);
          setRealVariantCount(data.realVariantCount ?? data.variants.length);
        }
      } catch (err) {
        console.error('Error loading variants:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVariants();
  }, [noteId]);

  // Initialize variant content when form is shown
  useEffect(() => {
    if (showAddForm && !variantContent) {
      // Start with current content or empty editor
      setVariantContent(content || { time: 0, blocks: [], version: '2.28.0' });
    }
  }, [showAddForm, content, variantContent]);

  const handleAddVariant = async () => {
    if (!variantContent || !variantContent.blocks || variantContent.blocks.length === 0) {
      setError('Variant content is required. Please add some content to the editor.');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (variants.length >= 10) {
      setError('Maximum 10 variants allowed per note');
      return;
    }

    setError(null);
    setIsEncrypting(true);

    try {
      // Encrypt content client-side
      const encryptionResult = await encryptNoteContent({
        note_id: noteId,
        password,
        content: variantContent,
      });

      // Convert salt and IV to hex strings for transmission
      const saltHex = uint8ArrayToHex(encryptionResult.salt);
      const ivHex = uint8ArrayToHex(encryptionResult.iv);

      // Send encrypted content to server
      const result = await addPasswordVariant({
        note_id: noteId,
        encrypted_content: encryptionResult.encrypted_content,
        salt: saltHex,
        iv: ivHex,
        kdf_iterations: encryptionResult.kdf_iterations,
      });

      if (result.success) {
        // Clear form
        setPassword('');
        setConfirmPassword('');
        setVariantContent(null);
        setShowAddForm(false);
        
        // Reload variants for manager (only real variants)
        const reloadResponse = await fetch(`/api/notes/${noteId}/variants?for=manager`);
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          if (reloadData.success) {
            setVariants(reloadData.variants);
            setRealVariantCount(reloadData.realVariantCount ?? reloadData.variants.length);
          }
        }
        
        onVariantAdded?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error adding variant:', err);
      setError(err instanceof Error ? err.message : 'Failed to add variant');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    setIsDeleting(variantId);
    setError(null);

    try {
      const result = await deletePasswordVariant(variantId);
      if (result.success) {
        // Reload variants for manager (only real variants)
        const reloadResponse = await fetch(`/api/notes/${noteId}/variants?for=manager`);
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          if (reloadData.success) {
            setVariants(reloadData.variants);
            setRealVariantCount(reloadData.realVariantCount ?? reloadData.variants.length);
          }
        }
        onVariantDeleted?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error deleting variant:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete variant');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDisableProtection = async () => {
    setIsDisabling(true);
    setError(null);

    try {
      const result = await disablePasswordProtection(noteId);
      if (result.success) {
        setVariants([]);
        onProtectionDisabled?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error disabling protection:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable protection');
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading variants...</span>
      </div>
    );
  }

  // Don't reveal exact count - show generic message
  const hasVariantsLocal = variants.length > 0;
  // Use real variant count (from database) not total count (which includes fake variants)
  const canAddMore = realVariantCount < 10; // Should be true when 0-9 real variants
  
  // Use prop if provided, otherwise calculate from local variants
  const showViewButton = hasVariants !== undefined ? hasVariants : hasVariantsLocal;
  
  // Debug: ensure canAddMore is correct
  // When variants.length is 0, canAddMore should be true (0 < 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Password Protection Active</span>
        </div>
        <div className="flex items-center gap-2">
          {showViewButton && onViewVariants && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewVariants}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              View Variants
            </Button>
          )}
          {/* Always show Add Variant button when can add more (including when 0 variants) */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={!canAddMore}
            className={!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDisabling}>
                {isDisabling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disable Protection
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable Password Protection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all password variants for this note. The note will no longer be password protected.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisableProtection}>
                  Disable Protection
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Add Variant Form - Inline on page */}
      {showAddForm && (
        <div className="border rounded-lg p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Password Variant</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setPassword('');
                setConfirmPassword('');
                setVariantContent(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variant-password">Password</Label>
              <Input
                id="note-variant-key"
                name="note-variant-key"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for this variant"
                disabled={isEncrypting}
                autoComplete="one-time-code"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-confirm-password">Confirm Password</Label>
              <Input
                id="note-variant-key-confirm"
                name="note-variant-key-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                disabled={isEncrypting}
                autoComplete="one-time-code"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Variant Content</Label>
            <p className="text-xs text-gray-500 mb-2">
              Edit the content for this variant. It can be different from the main note content.
            </p>
            <div className="border rounded-md">
              <NoteEditor
                initialContent={variantContent || content || { time: 0, blocks: [], version: '2.28.0' }}
                onChange={(newContent) => {
                  setVariantContent(newContent);
                }}
                readOnly={isEncrypting}
              />
            </div>
            {variantContent && variantContent.blocks && variantContent.blocks.length > 0 && (
              <div className="text-xs text-green-600">
                ✓ Content ready ({variantContent.blocks.length} blocks)
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setPassword('');
                setConfirmPassword('');
                setVariantContent(null);
                setError(null);
              }}
              disabled={isEncrypting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddVariant}
              disabled={isEncrypting || !password || !confirmPassword || !variantContent || !variantContent.blocks || variantContent.blocks.length === 0}
            >
              {isEncrypting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                'Add Variant'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Variant management - hidden to maintain plausible deniability */}
      {/* Variants are managed through the unlock dialog or password change functionality */}
      {/* No visible listing to prevent revealing variant count */}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

