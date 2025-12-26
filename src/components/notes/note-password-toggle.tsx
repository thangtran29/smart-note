'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Lock, Loader2 } from 'lucide-react';
import type { EditorJSContent } from '@/lib/notes/types';

interface NotePasswordToggleProps {
  noteId: string;
  content: EditorJSContent | null;
  isProtected: boolean;
  currentVariantId?: string | null;
  onProtectionEnabled?: () => void;
  onPasswordChanged?: () => void; // Kept for compatibility but not used
}

export function NotePasswordToggle({
  noteId,
  content: _content, // Unused but kept for compatibility
  isProtected,
  currentVariantId: _currentVariantId, // Unused but kept for compatibility
  onProtectionEnabled,
  onPasswordChanged: _onPasswordChanged, // Unused but kept for compatibility
}: NotePasswordToggleProps) {
  const [open, setOpen] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableProtection = async () => {
    // Just enable protection - no password required
    // Users will add variants through the variant manager
    setError(null);
    setIsEncrypting(true);

    try {
      // Simply enable protection mode - no variant creation needed
      // The variant manager will handle adding variants
      onProtectionEnabled?.();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable password protection');
    } finally {
      setIsEncrypting(false);
    }
  };

  // When protected, don't show anything - variant manager handles everything
  if (isProtected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="h-4 w-4 mr-2" />
          Enable Password Protection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Password Protection</DialogTitle>
          <DialogDescription>
            Enable password protection for this note. You can add password variants through the variant manager.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <div className="text-sm text-gray-600">
            Once enabled, you can add password-protected variants through the variant manager below.
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={isEncrypting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnableProtection}
            disabled={isEncrypting}
          >
            {isEncrypting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              'Enable Protection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

