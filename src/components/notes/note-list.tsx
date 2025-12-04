import { NoteCard } from './note-card';
import type { NoteSearchResult } from '@/lib/search/types';

interface NoteListProps {
  notes: NoteSearchResult[];
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
}

export function NoteList({ notes, searchQuery, viewMode = 'grid' }: NoteListProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} searchQuery={searchQuery} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} searchQuery={searchQuery} viewMode={viewMode} />
      ))}
    </div>
  );
}
