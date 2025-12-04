// AI Insights TypeScript Interfaces

import type { NoteSearchResult } from '@/lib/search/types';

export interface AIQuery {
  id: string;
  userId: string;
  queryText: string;
  selectedNoteIds: string[];
  aiModel: 'gpt-4' | 'gpt-3.5-turbo';
  tokenCount?: number;
  status: 'processing' | 'completed' | 'failed';
  responseText?: string;
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIQueryRequest {
  query: string;
  noteIds: string[];
  model?: 'gpt-4' | 'gpt-3.5-turbo';
}

export interface AIQueryResponse {
  success: true;
  data: {
    queryId: string;
    response: string;
    tokenCount: number;
    processingTime: number;
    notesAnalyzed: number;
    totalNotesSelected: number;
    truncationInfo: {
      wasTruncated: boolean;
      notesRemoved: number;
      tokenCount: number;
    };
  };
}

export interface AIQueryError {
  success: false;
  error: string;
  details?: string | Record<string, unknown>;
}

export interface NoteFilterCriteria {
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface FilteredNotesResult {
  notes: NoteSearchResult[];
  totalCount: number;
  appliedFilters: NoteFilterCriteria;
}

export interface TokenUsageInfo {
  estimatedTokens: number;
  maxTokens: number;
  notesCount: number;
  wouldTruncate: boolean;
}

/**
 * Simplified note object for AI processing
 */
export interface SimplifiedNote {
  title: string;
  content: string;
  created_at?: string; // Optional for sorting
}
