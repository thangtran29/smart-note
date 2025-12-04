'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { NoteSearchResult } from '@/lib/search/types';
import { extractNoteText } from '@/lib/notes/utils';
import type { EditorJSContent } from '@/lib/notes/types';

interface NotePreviewListProps {
  filters: {
    tagIds: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  onNotesChange?: (notes: NoteSearchResult[]) => void;
  className?: string;
}

export function NotePreviewList({ filters, onNotesChange, className }: NotePreviewListProps) {
  const [notes, setNotes] = useState<NoteSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes based on current filters
  useEffect(() => {
    const fetchFilteredNotes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters for the notes API
        const params = new URLSearchParams();

        if (filters.tagIds.length > 0) {
          filters.tagIds.forEach(tagId => params.append('tag', tagId));
        }

        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }

        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }

        // Limit to reasonable number for preview
        params.append('limit', '20');

        const response = await fetch(`/api/notes?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }

        const data = await response.json();
        setNotes(data.notes || []);
        onNotesChange?.(data.notes || []);
      } catch (err) {
        console.error('Failed to fetch filtered notes:', err);
        setError('Failed to load notes. Please try again.');
        setNotes([]);
        onNotesChange?.([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredNotes();
  }, [filters, onNotesChange]);

  const truncateContent = (content: EditorJSContent | null, maxLength: number = 150) => {
    const textContent = extractNoteText(content);
    if (!textContent || textContent.trim() === '') return 'No content available';
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength).trim() + '...';
  };

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <FileText className="h-5 w-5" />
            Error Loading Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Notes for Analysis ({notes.length})
        </CardTitle>
        <CardDescription>
          These notes are currently visible on your listing page and will be analyzed by AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No notes match your current filters</p>
            <p className="text-sm text-gray-400">
              Try adjusting your tag or date filters to include more notes.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {truncateContent(note.content)}
                  </p>

                  {(note.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(note.tags || []).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs px-2 py-0"
                          style={tag.color ? {
                            backgroundColor: tag.color + '20',
                            color: tag.color
                          } : undefined}
                        >
                          <Tag className="h-2 w-2 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{notes.length} note{notes.length !== 1 ? 's' : ''} selected</span>
              <Button variant="outline" size="sm">
                Analyze with AI
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
