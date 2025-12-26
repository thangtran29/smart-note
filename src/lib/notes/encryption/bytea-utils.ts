/**
 * Utilities for converting between hex strings and BYTEA format for Supabase
 */

/**
 * Convert hex string to format that Supabase/PostgreSQL expects for BYTEA
 * Supabase's PostgREST API expects hex strings with \x prefix for BYTEA columns
 */
export function hexToBytea(hex: string): string {
  // PostgreSQL BYTEA hex format: \x followed by hex digits
  // In JavaScript, we need to escape the backslash
  return `\\x${hex}`;
}

/**
 * Convert hex string to base64 (for sending to Supabase BYTEA columns)
 * Supabase's PostgREST API accepts base64 strings for BYTEA columns
 */
export function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  return btoa(binary);
}

/**
 * Convert base64 string to hex (for reading from Supabase BYTEA columns)
 * Supabase returns BYTEA as base64-encoded strings
 */
export function base64ToHex(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

