import type { EditorJSContent } from '@/lib/notes/types';

// Cryptographic metadata for a variant
export interface EncryptionMetadata {
  salt: Uint8Array;           // 16 bytes
  iv: Uint8Array;             // 12 bytes
  kdfType: 'pbkdf2';
  kdfIterations: number;      // 300000-500000
  kdfHash: 'SHA-256';
}

// Variant as stored in database (BYTEA fields converted to hex strings)
export interface NoteEncryptionVariant {
  id: string;
  note_id: string;
  encrypted_content: string;   // Base64 encoded
  salt: string;                 // Hex string (16 bytes)
  iv: string;                   // Hex string (12 bytes)
  kdf_type: 'pbkdf2';
  kdf_iterations: number;
  kdf_hash: 'SHA-256';
  created_at: string;
  secret?: string;              // Secret token for variant verification (optional, added by API)
}

// Variant with decrypted content (in memory only)
export interface DecryptedVariant {
  variant: NoteEncryptionVariant;
  content: EditorJSContent;     // Decrypted Editor.js content
}

// Input for creating a new variant
export interface CreateVariantInput {
  note_id: string;
  password: string;
  content: EditorJSContent;
  kdfIterations?: number;      // Optional, defaults to 300000
}

// Input for updating a variant
export interface UpdateVariantInput {
  variant_id: string;
  password?: string;            // If provided, re-encrypt with new password
  content?: EditorJSContent;    // If provided, update content
}

// Result of decryption attempt
export interface DecryptionResult {
  success: boolean;
  content?: EditorJSContent;    // Only present if success = true
  variant_id?: string;         // Which variant was successfully decrypted
}

// Result of encryption operation
export interface EncryptionResult {
  encrypted_content: string;     // Base64 encoded
  salt: Uint8Array;              // 16 bytes
  iv: Uint8Array;                 // 12 bytes
  kdf_iterations: number;
}

// Web Worker message types
export interface CryptoWorkerMessage {
  type: 'encrypt' | 'decrypt' | 'deriveKey';
  id: string;
  payload: unknown;
}

export interface EncryptPayload {
  password: string;
  content: string;              // JSON stringified EditorJSContent
  salt?: Uint8Array;
  iv?: Uint8Array;
  kdfIterations?: number;
}

export interface DecryptPayload {
  password: string;
  encryptedContent: string;     // Base64 encoded
  salt: string;                 // Hex string
  iv: string;                   // Hex string
  kdfIterations: number;
}

export interface DeriveKeyPayload {
  password: string;
  salt: Uint8Array;
  iterations: number;
}

export interface CryptoWorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

