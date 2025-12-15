/**
 * Cookie utilities for filter persistence
 * Handles browser cookie operations with proper error handling and size limits
 */

import type { PersistedFilters } from '@/types/filters';

const COOKIE_NAME = 'note-filters';
const COOKIE_PATH = '/notes';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Read persisted filters from browser cookies
 * @returns PersistedFilters object or null if not found/invalid
 */
export function readPersistedFilters(): PersistedFilters | null {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${COOKIE_NAME}=`));

    if (!cookie) return null;

    const value = cookie.split('=')[1];
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);

    // Basic validation
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.tagIds)) return null;
    if (parsed.timestamp && typeof parsed.timestamp !== 'number') return null;

    return parsed as PersistedFilters;
  } catch (error) {
    console.warn('Failed to read filter cookies:', error);
    return null;
  }
}

/**
 * Write filter state to browser cookies
 * @param filters Complete filter state to persist
 * @returns true if successfully saved, false otherwise
 */
export function writePersistedFilters(filters: PersistedFilters): boolean {
  try {
    const value = JSON.stringify(filters);
    const encoded = encodeURIComponent(value);

    // Check size limit (4000 bytes for cookies)
    if (encoded.length > 4000) {
      console.warn('Filter data too large for cookie storage');
      return false;
    }

    const cookieParts = [
      `${COOKIE_NAME}=${encoded}`,
      `path=${COOKIE_PATH}`,
      `max-age=${COOKIE_MAX_AGE}`,
      'samesite=lax',
      ...(process.env.NODE_ENV === 'production' ? ['secure'] : [])
    ];

    document.cookie = cookieParts.join('; ');
    return true;
  } catch (error) {
    console.warn('Failed to write filter cookies:', error);
    return false;
  }
}

/**
 * Clear persisted filter state from cookies
 * @returns true if successfully cleared, false otherwise
 */
export function clearPersistedFilters(): boolean {
  try {
    const cookieParts = [
      `${COOKIE_NAME}=`,
      `path=${COOKIE_PATH}`,
      'max-age=0',
      'samesite=lax',
      ...(process.env.NODE_ENV === 'production' ? ['secure'] : [])
    ];

    document.cookie = cookieParts.join('; ');
    return true;
  } catch (error) {
    console.warn('Failed to clear filter cookies:', error);
    return false;
  }
}

/**
 * Check if cookies are enabled and available
 * @returns true if cookies can be used, false otherwise
 */
export function areCookiesEnabled(): boolean {
  try {
    // Try to set a test cookie
    document.cookie = 'test=1; max-age=1; path=/';
    const testCookie = document.cookie.includes('test=1');

    // Clean up test cookie
    document.cookie = 'test=; max-age=0; path=/';

    return testCookie;
  } catch (error) {
    console.warn('Cookie availability check failed:', error);
    return false;
  }
}

/**
 * Get current cookie size usage
 * @returns Object with size information
 */
export function getCookieSizeInfo(): { used: number; max: number; percentage: number } {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${COOKIE_NAME}=`));

    if (!cookie) return { used: 0, max: 4000, percentage: 0 };

    const value = cookie.split('=')[1];
    const used = encodeURIComponent(value).length;
    const percentage = (used / 4000) * 100;

    return { used, max: 4000, percentage };
  } catch (error) {
    console.warn('Failed to get cookie size info:', error);
    return { used: 0, max: 4000, percentage: 0 };
  }
}
