/**
 * PBKDF2 key derivation wrapper
 * Uses Web Crypto API for secure key derivation
 */

const DEFAULT_ITERATIONS = 300000;
const MIN_ITERATIONS = 300000;
const MAX_ITERATIONS = 500000;

export interface PBKDF2Options {
  salt: Uint8Array;
  iterations?: number;
  hash?: 'SHA-256';
}

/**
 * Derive a 256-bit encryption key from a password using PBKDF2
 * @param password - User's password
 * @param options - PBKDF2 options (salt, iterations, hash)
 * @returns Derived CryptoKey for AES-256-GCM
 */
export async function deriveKey(
  password: string,
  options: PBKDF2Options
): Promise<CryptoKey> {
  const iterations = Math.max(
    MIN_ITERATIONS,
    Math.min(MAX_ITERATIONS, options.iterations ?? DEFAULT_ITERATIONS)
  );

  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive 256-bit key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: options.salt,
      iterations,
      hash: options.hash ?? 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Generate a random 16-byte salt for PBKDF2
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

