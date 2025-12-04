'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { NoteBreadcrumb } from '@/components/notes/note-breadcrumb';
import { TagFilter } from '@/components/tags/tag-filter';
import { SearchInput } from '@/components/notes/search-input';
import { DateFilter } from '@/components/notes/date-filter';
import { FilterBar } from '@/components/notes/filter-bar';
import { searchNotes } from '@/lib/notes/client-queries';
import { getNotesWithTags } from '@/lib/tags/client-queries';
import { Plus, FileText, Grid3X3, List } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import type { NoteSearchResult, DateFilterState, NoteSearchParams } from '@/lib/search/types';
import type { EditorJSContent } from '@/lib/notes/types';

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<NoteSearchResult[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ preset: 'custom' });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize selectedTagIds from URL params
  useEffect(() => {
    const tagParam = searchParams.get('tags');
    if (tagParam) {
      const tagIds = tagParam.split(',').filter(Boolean);
      setSelectedTagIds(tagIds);
    } else {
      setSelectedTagIds([]);
    }
  }, [searchParams]);

  // Update URL when selectedTagIds change
  const handleTagChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);

    // Update URL
    const params = new URLSearchParams();
    if (tagIds.length > 0) {
      params.set('tags', tagIds.join(','));
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/notes${newUrl}`, { scroll: false });
  };

  // Clear search filter
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Clear date filter
  const handleClearDateFilter = () => {
    setDateFilter({ preset: 'custom' });
  };

  // Clear specific tag filter
  const handleClearTagFilter = (tagId: string) => {
    const newTagIds = selectedTagIds.filter(id => id !== tagId);
    handleTagChange(newTagIds);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDateFilter({ preset: 'custom' });
    handleTagChange([]);
  };

  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim()) {
          // Use search API when there's a query
          const searchParams: NoteSearchParams = {
            query: searchQuery.trim(),
            limit: 50,
            dateFrom: dateFilter.preset === 'custom' && dateFilter.customFrom
              ? dateFilter.customFrom.toISOString()
              : undefined,
            dateTo: dateFilter.preset === 'custom' && dateFilter.customTo
              ? (() => {
                  const endOfDay = new Date(dateFilter.customTo!);
                  endOfDay.setHours(23, 59, 59, 999);
                  return endOfDay.toISOString();
                })()
              : undefined,
            datePreset: dateFilter.preset !== 'custom' ? dateFilter.preset : undefined,
          };

          const response = await searchNotes(searchParams);
          setNotes(response.notes);
        } else if (selectedTagIds.length > 0) {
          // Use tag filtering when tags are selected but no search query
          const tagFilter = { tagIds: selectedTagIds };
          const response = await getNotesWithTags(tagFilter, 50, 0);

          // Transform NoteWithTags[] to NoteSearchResult[]
          const transformedNotes: NoteSearchResult[] = response.notes.map(note => ({
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            content: note.content as EditorJSContent | null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: note.tags,
            // Add any missing properties from NoteSearchResult
            highlights: [],
            score: 1,
          }));

          setNotes(transformedNotes);
        } else {
          // Use notes with tags API to always include tag information
          const response = await getNotesWithTags({}, 50, 0);

          // Transform NoteWithTags[] to NoteSearchResult[]
          const transformedNotes: NoteSearchResult[] = response.notes.map(note => ({
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            content: note.content as EditorJSContent | null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: note.tags,
            // Add any missing properties from NoteSearchResult
            highlights: [],
            score: 1,
          }));

          setNotes(transformedNotes);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [searchQuery, dateFilter, selectedTagIds]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Notes
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header with Breadcrumb */}
            <div className="mb-6">
              <NoteBreadcrumb items={[{ label: 'Notes' }]} />
            </div>

            {/* Search and Filters Block */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search on the left */}
                <div className="flex-1 lg:max-w-md">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search notes by title and content..."
                    disabled={isLoading}
                  />
                </div>

                {/* Custom range and filter by tags on the right */}
                <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:justify-end">
                  <DateFilter
                    filterState={dateFilter}
                    onFilterChange={setDateFilter}
                    disabled={isLoading}
                  />
                  <TagFilter
                    selectedTagIds={selectedTagIds}
                    onChange={handleTagChange}
                  />
                </div>
              </div>
            </div>

            {/* View Toggle and New Note Button */}
            <div className="mb-6 flex items-center justify-between">
              {/* View Toggle */}
              <div className="flex items-center border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* New Note Button */}
              <Link href="/notes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </Link>
            </div>

            {/* Active Filters */}
            <div className="mb-6">
              <FilterBar
                searchQuery={searchQuery}
                dateFilter={dateFilter}
                selectedTagIds={selectedTagIds}
                onClearSearch={handleClearSearch}
                onClearDateFilter={handleClearDateFilter}
                onClearTagFilter={handleClearTagFilter}
                onClearAllFilters={handleClearAllFilters}
                disabled={isLoading}
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">Loading notes...</div>
              </div>
            ) : notes.length === 0 && selectedTagIds.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No notes yet
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Get started by creating your first note.
                </p>
                <div className="mt-6">
                  <Link href="/notes/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first note
                    </Button>
                  </Link>
                </div>
              </div>
            ) : notes.length === 0 && selectedTagIds.length > 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No notes match the selected tags
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Try selecting fewer tags or clear the filter to see all notes.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleTagChange([])}
                  >
                    Clear filter
                  </Button>
                </div>
              </div>
            ) : (
              <NoteList notes={notes} searchQuery={searchQuery} viewMode={viewMode} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* TagList removed as per user request */}
          </div>
        </div>
      </div>
    </div>
  );
}
