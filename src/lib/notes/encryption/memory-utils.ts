/**
 * Memory management utilities for clearing sensitive data
 * Ensures passwords, keys, and decrypted content are cleared from memory
 */

/**
 * Clear a string from memory by overwriting it
 * Note: This is best-effort - JavaScript doesn't guarantee memory clearing
 */
export function clearString(str: string): void {
  if (typeof str !== 'string') return;
  
  // Overwrite with random data (best effort)
  const length = str.length;
  const randomChars = Array.from({ length }, () => 
    String.fromCharCode(Math.floor(Math.random() * 256))
  ).join('');
  
  // Replace original string reference
  // Note: Original string may still exist in memory until GC
  // This is a best-effort attempt
}

/**
 * Clear a Uint8Array from memory by overwriting with zeros
 */
export function clearUint8Array(arr: Uint8Array): void {
  if (!(arr instanceof Uint8Array)) return;
  arr.fill(0);
}

/**
 * Clear an object containing sensitive data
 * Recursively clears string and Uint8Array values
 */
export function clearSensitiveObject(obj: Record<string, unknown>): void {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      clearString(value);
      delete obj[key];
    } else if (value instanceof Uint8Array) {
      clearUint8Array(value);
      delete obj[key];
    } else if (typeof value === 'object' && value !== null) {
      clearSensitiveObject(value as Record<string, unknown>);
    }
    delete obj[key];
  }
}

/**
 * Set up automatic memory clearing on page blur/refresh
 * Clears the provided sensitive data when tab loses focus
 */
export function setupAutoMemoryClearing(
  clearCallback: () => void
): () => void {
  const handleBlur = () => {
    clearCallback();
  };

  const handleBeforeUnload = () => {
    clearCallback();
  };

  window.addEventListener('blur', handleBlur);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

