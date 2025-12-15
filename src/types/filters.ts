/**
 * TypeScript interfaces for note filter persistence
 * Used across the application for consistent filter state management
 */

export interface FilterState {
  /** Array of selected tag UUIDs for filtering */
  tagIds: string[];

  /** Optional start date filter in ISO format (YYYY-MM-DD) */
  dateFrom?: string;

  /** Optional end date filter in ISO format (YYYY-MM-DD) */
  dateTo?: string;

  /** View mode: grid or list */
  viewMode?: 'grid' | 'list';
}

export interface PersistedFilters extends FilterState {
  /** Unix timestamp when filters were last saved (milliseconds) */
  timestamp: number;
}

/**
 * Validation result for filter operations
 */
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Hook return type for filter persistence
 */
export interface UseFilterPersistenceReturn {
  /** Current persisted filters loaded from cookie */
  persistedFilters: PersistedFilters | null;

  /** Save current filter state to cookie */
  saveFilters: (filters: FilterState) => boolean;

  /** Clear persisted filter state */
  clearFilters: () => boolean;

  /** Whether cookie operations are available */
  cookiesEnabled: boolean;
}
