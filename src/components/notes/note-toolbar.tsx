'use client';

import { Button } from '@/components/ui/button';
import { Save, Trash2, Loader2 } from 'lucide-react';

interface NoteToolbarProps {
  onSave?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  showDelete?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export function NoteToolbar({
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  showDelete = false,
  saveStatus = 'idle',
}: NoteToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {saveStatus === 'saving' && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-sm text-green-600">Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Error saving</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {showDelete && onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-2">Delete</span>
          </Button>
        )}
        
        {onSave && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-2">Save</span>
          </Button>
        )}
      </div>
    </div>
  );
}
