// AI Insights Note Filtering Utilities

import type { NoteSearchResult } from '@/lib/search/types';
import type { NoteFilterCriteria } from './types';

/**
 * Filter notes based on provided criteria
 */
export function filterNotes(
  notes: NoteSearchResult[],
  criteria: NoteFilterCriteria
): NoteSearchResult[] {
  let filtered = [...notes];

  // Filter by tags (AND logic - note must have ALL specified tags)
  if (criteria.tagIds && criteria.tagIds.length > 0) {
    filtered = filtered.filter(note => {
      if (!note.tags) return false;

      const noteTagIds = note.tags.map(tag => tag.id);
      return criteria.tagIds!.every(tagId => noteTagIds.includes(tagId));
    });
  }

  // Filter by date range
  if (criteria.dateFrom || criteria.dateTo) {
    filtered = filtered.filter(note => {
      const noteDate = new Date(note.updated_at);

      if (criteria.dateFrom) {
        const fromDate = new Date(criteria.dateFrom);
        fromDate.setHours(0, 0, 0, 0); // Start of day
        if (noteDate < fromDate) return false;
      }

      if (criteria.dateTo) {
        const toDate = new Date(criteria.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (noteDate > toDate) return false;
      }

      return true;
    });
  }

  return filtered;
}

/**
 * Get filter summary for display
 */
export function getFilterSummary(
  criteria: NoteFilterCriteria,
  availableTags: Array<{ id: string; name: string }>
): {
  tagNames: string[];
  dateRange?: { from: string; to?: string };
  totalFilters: number;
} {
  const summary = {
    tagNames: [] as string[],
    dateRange: undefined as { from: string; to?: string } | undefined,
    totalFilters: 0
  };

  // Tag summary
  if (criteria.tagIds && criteria.tagIds.length > 0) {
    summary.tagNames = criteria.tagIds.map(tagId => {
      const tag = availableTags.find(t => t.id === tagId);
      return tag?.name || `Tag ${tagId}`;
    });
    summary.totalFilters += criteria.tagIds.length;
  }

  // Date range summary
  if (criteria.dateFrom || criteria.dateTo) {
    const from = criteria.dateFrom ? new Date(criteria.dateFrom).toLocaleDateString() : '';
    const to = criteria.dateTo ? new Date(criteria.dateTo).toLocaleDateString() : '';

    summary.dateRange = { from, to: to || undefined };
    summary.totalFilters += 1;
  }

  return summary;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(criteria: NoteFilterCriteria): boolean {
  return !!(criteria.tagIds?.length || criteria.dateFrom || criteria.dateTo);
}

/**
 * Get recommended filter combinations for better AI analysis
 */
export function getFilterSuggestions(
  totalNotes: number,
  availableTags: Array<{ id: string; name: string; count: number }>
): Array<{
  type: 'tag' | 'date' | 'combined';
  title: string;
  description: string;
  criteria: NoteFilterCriteria;
}> {
  const suggestions = [];

  // Suggest popular tags
  const popularTags = availableTags
    .filter(tag => tag.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  popularTags.forEach(tag => {
    suggestions.push({
      type: 'tag' as const,
      title: `Focus on "${tag.name}"`,
      description: `${tag.count} notes tagged with "${tag.name}"`,
      criteria: { tagIds: [tag.id] }
    });
  });

  // Suggest recent notes (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  suggestions.push({
    type: 'date' as const,
    title: 'Recent Notes',
    description: 'Notes from the last 7 days',
    criteria: { dateFrom: sevenDaysAgo.toISOString() }
  });

  // Suggest this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  suggestions.push({
    type: 'date' as const,
    title: 'This Month',
    description: 'Notes created this month',
    criteria: { dateFrom: startOfMonth.toISOString() }
  });

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}
