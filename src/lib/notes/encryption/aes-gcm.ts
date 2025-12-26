/**
 * AES-256-GCM encryption/decryption wrapper
 * Uses Web Crypto API for authenticated encryption
 */

const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 128; // 128-bit authentication tag

export interface AESGCMOptions {
  key: CryptoKey;
  iv: Uint8Array;
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (as string)
 * @param options - Encryption options (key, IV)
 * @returns Encrypted data as Base64 string
 */
export async function encrypt(
  data: string,
  options: AESGCMOptions
): Promise<string> {
  if (options.iv.length !== IV_LENGTH) {
    throw new Error(`IV must be exactly ${IV_LENGTH} bytes`);
  }

  const encodedData = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: options.iv,
      tagLength: TAG_LENGTH,
    },
    options.key,
    encodedData
  );

  // Convert to Base64
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Encrypted data as Base64 string
 * @param options - Decryption options (key, IV)
 * @returns Decrypted data as string
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 */
export async function decrypt(
  encryptedData: string,
  options: AESGCMOptions
): Promise<string> {
  if (options.iv.length !== IV_LENGTH) {
    throw new Error(`IV must be exactly ${IV_LENGTH} bytes`);
  }

  const encrypted = base64ToArrayBuffer(encryptedData);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: options.iv,
        tagLength: TAG_LENGTH,
      },
      options.key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // Decryption failed - wrong key, corrupted data, or tampering
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
}

/**
 * Generate a random 12-byte IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

