'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { getPreview, formatRelativeTime, getDisplayTitle } from '@/lib/notes/utils';
import { DeleteNoteDialog } from './delete-note-dialog';
import { TagsDisplay } from './tags-display';
import type { Note } from '@/lib/supabase/types';
import type { NoteSearchResult } from '@/lib/search/types';
import type { Tag } from '@/lib/tags/types';

interface NoteCardProps {
  note: NoteSearchResult;
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function NoteCard({ note, searchQuery, viewMode = 'grid' }: NoteCardProps) {
  const displayTitle = getDisplayTitle(note.title);
  const preview = getPreview(note.content);
  const relativeTime = formatRelativeTime(note.updated_at);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  // List view layout
  if (viewMode === 'list') {
    return (
      <>
        <div className="relative group">
          <Link href={`/notes/${note.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">
                      {searchQuery ? highlightText(displayTitle, searchQuery) : displayTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {searchQuery ? highlightText(preview, searchQuery) : preview}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {relativeTime}
                    </p>
                    <TagsDisplay tags={note.tags} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <DeleteNoteDialog
          noteId={note.id}
          noteTitle={displayTitle}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      </>
    );
  }

  // Grid view layout (default)
  return (
    <>
      <div className="relative group">
        <Link href={`/notes/${note.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">
                {searchQuery ? highlightText(displayTitle, searchQuery) : displayTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {searchQuery ? highlightText(preview, searchQuery) : preview}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {relativeTime}
              </p>
              <TagsDisplay tags={note.tags} />
            </CardContent>
          </Card>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <DeleteNoteDialog
        noteId={note.id}
        noteTitle={displayTitle}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}

// Simple note card for dashboard/server components that don't need search
export function SimpleNoteCard({ note }: { note: Note & { tags?: Tag[] } }) {
  const displayTitle = getDisplayTitle(note.title);
  const preview = getPreview(note.content);
  const relativeTime = formatRelativeTime(note.updated_at);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="relative group">
        <Link href={`/notes/${note.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">
                {displayTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {preview}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {relativeTime}
              </p>
              <TagsDisplay tags={note.tags} />
            </CardContent>
          </Card>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <DeleteNoteDialog
        noteId={note.id}
        noteTitle={displayTitle}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
