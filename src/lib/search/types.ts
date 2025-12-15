import type { EditorJSContent } from '@/lib/notes/types';

// Date filter presets
export type DateFilterPreset =
  | 'today'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'custom';

// Search and filter parameters
export interface NoteSearchParams {
  query?: string;           // Search text (title + content)
  dateFrom?: string;        // ISO date string (inclusive)
  dateTo?: string;          // ISO date string (inclusive)
  datePreset?: DateFilterPreset; // Date preset for filtering
  tagIds?: string[];        // Note tag filtering (AND logic)
  limit?: number;           // Pagination limit
  offset?: number;          // Pagination offset
}

// Search result metadata
export interface SearchMetadata {
  total: number;
  searchTime: number;       // Search execution time in ms
  appliedFilters: {
    query?: string;
    dateFrom?: string;
    dateTo?: string;
    tagIds?: string[];
  };
}

// Search API response
export interface NoteSearchResponse {
  notes: NoteSearchResult[];
  metadata: SearchMetadata;
}

// Note type with search relevance
export interface NoteSearchResult {
  id: string;
  user_id: string;
  title: string;
  content: EditorJSContent | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
  tags?: Array<{ id: string; name: string; color?: string }>; // Associated tags
  searchRank?: number;      // FTS relevance score (0-1)
  matchedFields?: string[]; // Which fields matched ('title' | 'content')
}

// Date filter state
export interface DateFilterState {
  preset: DateFilterPreset;
  customFrom?: Date;
  customTo?: Date;
}

// Combined filter state
export interface SearchFilters {
  query: string;
  dateFilter: DateFilterState;
  tagIds: string[];
}

// Active filter for display
export interface ActiveFilter {
  type: 'query' | 'date' | 'tag';
  label: string;
  value: string;
  onRemove: () => void;
}
