/**
 * Web Worker for cryptographic operations
 * Handles PBKDF2 key derivation and AES-GCM encryption/decryption
 * Runs in separate thread to prevent UI blocking
 */

// Message handler for crypto operations
self.onmessage = async (event: MessageEvent<CryptoWorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case 'deriveKey': {
        const { password, salt, iterations } = payload as DeriveKeyPayload;
        const key = await deriveKey(password, salt, iterations);
        self.postMessage({
          id,
          success: true,
          data: { key },
        } as CryptoWorkerResponse);
        break;
      }

      case 'encrypt': {
        const { password, content, salt, iv, kdfIterations = 300000 } = payload as EncryptPayload;
        const result = await encryptContent(password, content, salt, iv, kdfIterations);
        self.postMessage({
          id,
          success: true,
          data: result,
        } as CryptoWorkerResponse);
        break;
      }

      case 'decrypt': {
        const { password, encryptedContent, salt, iv, kdfIterations } = payload as DecryptPayload;
        const result = await decryptContent(password, encryptedContent, salt, iv, kdfIterations);
        self.postMessage({
          id,
          success: true,
          data: result,
        } as CryptoWorkerResponse);
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as CryptoWorkerResponse);
  }
};

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
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
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt content using AES-256-GCM
 */
async function encryptContent(
  password: string,
  content: string,
  salt?: Uint8Array,
  iv?: Uint8Array,
  kdfIterations: number = 300000
): Promise<{ encryptedContent: string; salt: Uint8Array; iv: Uint8Array; kdfIterations: number }> {
  // Generate salt and IV if not provided
  const finalSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const finalIv = iv || crypto.getRandomValues(new Uint8Array(12));

  // Derive key
  const key = await deriveKey(password, finalSalt, kdfIterations);

  // Encrypt content
  const encodedContent = new TextEncoder().encode(content);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: finalIv,
      tagLength: 128,
    },
    key,
    encodedContent
  );

  // Convert to Base64
  const encryptedContent = arrayBufferToBase64(encrypted);

  return {
    encryptedContent,
    salt: finalSalt,
    iv: finalIv,
    kdfIterations,
  };
}

/**
 * Decrypt content using AES-256-GCM
 */
async function decryptContent(
  password: string,
  encryptedContent: string,
  saltHex: string,
  ivHex: string,
  kdfIterations: number
): Promise<{ content: string }> {
  // Convert hex strings to Uint8Array
  const salt = hexToUint8Array(saltHex);
  const iv = hexToUint8Array(ivHex);

  // Derive key
  const key = await deriveKey(password, salt, kdfIterations);

  // Convert Base64 to ArrayBuffer
  const encrypted = base64ToArrayBuffer(encryptedContent);

  // Decrypt
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      encrypted
    );

    // Convert to string
    const content = new TextDecoder().decode(decrypted);

    return { content };
  } catch (error) {
    // Decryption failed - wrong password or corrupted data
    throw new Error('Decryption failed');
  }
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

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Type definitions for worker messages
interface CryptoWorkerMessage {
  type: 'encrypt' | 'decrypt' | 'deriveKey';
  id: string;
  payload: unknown;
}

interface EncryptPayload {
  password: string;
  content: string;
  salt?: Uint8Array;
  iv?: Uint8Array;
  kdfIterations?: number;
}

interface DecryptPayload {
  password: string;
  encryptedContent: string;
  salt: string;
  iv: string;
  kdfIterations: number;
}

interface DeriveKeyPayload {
  password: string;
  salt: Uint8Array;
  iterations: number;
}

interface CryptoWorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

