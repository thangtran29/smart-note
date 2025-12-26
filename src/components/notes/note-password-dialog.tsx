'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Lock } from 'lucide-react';
import { getNoteVariants } from '@/lib/notes/client-queries';
import { decryptNoteVariants } from '@/lib/notes/encryption/variant-manager';
import { logDecryptionStart, logDecryptionSuccess, logDecryptionError } from '@/lib/notes/encryption/logger';
import type { EditorJSContent } from '@/lib/notes/types';

interface NotePasswordDialogProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (content: EditorJSContent, variantId?: string, password?: string) => void;
}

export function NotePasswordDialog({
  noteId,
  open,
  onOpenChange,
  onUnlock,
}: NotePasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear password and error when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setError(null);
    }
  }, [open]);

  // Clear decrypted content from memory when tab loses focus
  useEffect(() => {
    const handleBlur = () => {
      // Clear any decrypted content references
      setPassword('');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Generate fake content for plausible deniability
  const generateFakeContent = (): EditorJSContent => {
    const fakeTexts = [
      'This is a placeholder note.',
      'Sample content for demonstration.',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'This note contains placeholder text.',
      'Sample text for testing purposes.',
    ];
    
    const randomText = fakeTexts[Math.floor(Math.random() * fakeTexts.length)];
    
    return {
      time: Date.now(),
      blocks: [
        {
          type: 'paragraph',
          data: {
            text: randomText,
          },
        },
      ],
      version: '2.28.0',
    };
  };

  const handleUnlock = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setError(null);
    setIsDecrypting(true);

    try {
      logDecryptionStart(noteId);
      
      // Fetch all variants for the note
      const variantsResult = await getNoteVariants(noteId);
      if (!variantsResult.success || !variantsResult.variants || variantsResult.variants.length === 0) {
        // No variants - show fake content for plausible deniability
        const fakeContent = generateFakeContent();
        setPassword('');
        onUnlock(fakeContent, undefined, undefined);
        onOpenChange(false);
        setIsDecrypting(false);
        return;
      }

      // Attempt decryption
      const decryptResult = await decryptNoteVariants(password, variantsResult.variants);

      if (decryptResult.success && decryptResult.content) {
        logDecryptionSuccess(noteId, decryptResult.variant_id);
        
        // Pass password temporarily for re-encryption (will be cleared on lock)
        const variantId = decryptResult.variant_id;
        const tempPassword = password; // Store before clearing
        setPassword('');
        onUnlock(decryptResult.content, variantId, tempPassword);
        onOpenChange(false);
      } else {
        // Decryption failed - show fake content instead of error
        // This prevents password enumeration attacks
        logDecryptionError(noteId, 'Decryption failed - showing fake content');
        const fakeContent = generateFakeContent();
        setPassword('');
        onUnlock(fakeContent, undefined, undefined);
        onOpenChange(false);
      }
    } catch (err) {
      // On error, also show fake content
      logDecryptionError(noteId, err instanceof Error ? err : 'Unknown error');
      const fakeContent = generateFakeContent();
      setPassword('');
      onUnlock(fakeContent, undefined, undefined);
      onOpenChange(false);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDecrypting) {
      handleUnlock();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock Protected Note
          </DialogTitle>
          <DialogDescription>
            This note is password protected. Enter your password to view the content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <Input
              id="note-decrypt-key"
              name="note-decrypt-key"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
              disabled={isDecrypting}
              autoFocus
              autoComplete="one-time-code"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              aria-label="Password to unlock protected note"
              aria-describedby="unlock-password-description"
            />
            <p id="unlock-password-description" className="sr-only">
              Enter the password to unlock this protected note
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPassword('');
              setError(null);
            }}
            disabled={isDecrypting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnlock}
            disabled={isDecrypting || !password}
          >
            {isDecrypting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

