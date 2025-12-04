import type { NoteSearchParams, DateFilterPreset } from './types';

/**
 * Validates search query parameters
 */
export function validateSearchParams(params: Partial<NoteSearchParams>): NoteSearchParams {
  const validated: NoteSearchParams = {};

  // Validate query
  if (params.query !== undefined) {
    if (typeof params.query !== 'string') {
      throw new Error('Search query must be a string');
    }
    const trimmed = params.query.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > 200) {
        throw new Error('Search query too long (max 200 characters)');
      }
      validated.query = trimmed;
    }
  }

  // Validate date range
  if (params.dateFrom !== undefined || params.dateTo !== undefined) {
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
    const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

    if (dateFrom && isNaN(dateFrom.getTime())) {
      throw new Error('Invalid dateFrom format');
    }
    if (dateTo && isNaN(dateTo.getTime())) {
      throw new Error('Invalid dateTo format');
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new Error('Start date must be before end date');
    }

    if (dateFrom) validated.dateFrom = params.dateFrom;
    if (dateTo) validated.dateTo = params.dateTo;
  }

  // Validate tag IDs
  if (params.tagIds !== undefined) {
    if (!Array.isArray(params.tagIds)) {
      throw new Error('tagIds must be an array');
    }
    if (params.tagIds.length > 10) {
      throw new Error('Too many tags (max 10)');
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const tagId of params.tagIds) {
      if (typeof tagId !== 'string' || !uuidRegex.test(tagId)) {
        throw new Error('Invalid tag ID format');
      }
    }
    validated.tagIds = params.tagIds;
  }

  // Validate pagination
  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    validated.limit = params.limit;
  }

  if (params.offset !== undefined) {
    if (typeof params.offset !== 'number' || params.offset < 0) {
      throw new Error('Offset must be non-negative');
    }
    validated.offset = params.offset;
  }

  return validated;
}

/**
 * Converts date preset to date range
 */
export function presetToDateRange(preset: DateFilterPreset): { from: Date; to: Date } | null {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
      };

    case 'last-7-days':
      return {
        from: new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now
      };

    case 'last-30-days':
      return {
        from: new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now
      };

    case 'this-month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        from: startOfMonth,
        to: endOfMonth
      };

    case 'custom':
    default:
      return null;
  }
}

/**
 * Formats date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats date range for display
 */
export function formatDateRangeForDisplay(from: Date, to: Date): string {
  const fromStr = formatDateForDisplay(from);
  const toStr = formatDateForDisplay(to);
  return fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
}

/**
 * Debounce function for search input
 */
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Checks if search query is valid (non-empty after trimming)
 */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * Sanitizes search query (trims whitespace)
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim();
}

/**
 * Get date filter display name
 */
export function getDateFilterDisplayName(preset: DateFilterPreset): string {
  switch (preset) {
    case 'today':
      return 'Today';
    case 'last-7-days':
      return 'Last 7 days';
    case 'last-30-days':
      return 'Last 30 days';
    case 'this-month':
      return 'This month';
    case 'custom':
      return 'Custom range';
    default:
      return 'All dates';
  }
}

/**
 * Check if date preset is active (not showing all dates)
 */
export function isDateFilterActive(preset: DateFilterPreset): boolean {
  return preset !== 'custom'; // For now, assume custom means no filter
}
