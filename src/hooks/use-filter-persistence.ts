/**
 * React hook for managing filter persistence in browser cookies
 * Provides automatic saving/loading of filter state with error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  readPersistedFilters,
  writePersistedFilters,
  clearPersistedFilters,
  areCookiesEnabled
} from '@/lib/cookies/filter-cookies';
import type { FilterState, PersistedFilters, UseFilterPersistenceReturn } from '@/types/filters';

export function useFilterPersistence(): UseFilterPersistenceReturn {
  const [persistedFilters, setPersistedFilters] = useState<PersistedFilters | null>(null);

  // Load filters on mount
  useEffect(() => {
    // Check cookies on client-side only
    const cookiesEnabled = areCookiesEnabled();

    if (cookiesEnabled) {
      const filters = readPersistedFilters();
      setPersistedFilters(filters);
    }
  }, []);

  const saveFilters = useCallback((filters: FilterState): boolean => {
    const cookiesEnabled = areCookiesEnabled();
    if (!cookiesEnabled) return false;

    try {
      const persisted: PersistedFilters = {
        ...filters,
        timestamp: Date.now()
      };

      const success = writePersistedFilters(persisted);
      if (success) {
        setPersistedFilters(persisted);
      }
      return success;
    } catch (error) {
      console.warn('Failed to save filters:', error);
      return false;
    }
  }, []);

  const clearFilters = useCallback((): boolean => {
    const cookiesEnabled = areCookiesEnabled();
    if (!cookiesEnabled) return false;

    try {
      const success = clearPersistedFilters();
      if (success) {
        setPersistedFilters(null);
      }
      return success;
    } catch (error) {
      console.warn('Failed to clear filters:', error);
      return false;
    }
  }, []);

  return {
    persistedFilters,
    saveFilters,
    clearFilters,
    get cookiesEnabled() {
      return areCookiesEnabled();
    }
  };
}
