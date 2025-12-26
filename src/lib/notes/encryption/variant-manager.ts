/**
 * Variant manager for handling multiple encrypted variants
 * Provides high-level functions for encrypting and decrypting note content
 */

import type { EditorJSContent } from '@/lib/notes/types';
import type {
  NoteEncryptionVariant,
  EncryptionResult,
  DecryptionResult,
  CreateVariantInput,
} from './types';
import { deriveKey, generateSalt } from './pbkdf2';
import { encrypt, decrypt, generateIV } from './aes-gcm';

const DEFAULT_KDF_ITERATIONS = 300000;

/**
 * Encrypt note content with a password
 * @param input - Encryption input (password, content, optional iterations)
 * @returns Encrypted content and metadata
 */
export async function encryptNoteContent(
  input: CreateVariantInput
): Promise<EncryptionResult> {
  const kdfIterations = input.kdfIterations ?? DEFAULT_KDF_ITERATIONS;
  const salt = generateSalt();
  const iv = generateIV();

  // Convert content to JSON string
  const contentString = JSON.stringify(input.content);

  // Derive key from password
  const key = await deriveKey(input.password, {
    salt,
    iterations: kdfIterations,
    hash: 'SHA-256',
  });

  // Encrypt content
  const encryptedContent = await encrypt(contentString, { key, iv });

  return {
    encrypted_content: encryptedContent,
    salt,
    iv,
    kdf_iterations: kdfIterations,
  };
}

/**
 * Decrypt variants by attempting decryption with a password
 * Randomizes variant order to prevent timing attacks
 * @param password - Password to attempt decryption with
 * @param variants - Array of encrypted variants
 * @returns Decryption result with content if successful
 */
export async function decryptNoteVariants(
  password: string,
  variants: NoteEncryptionVariant[]
): Promise<DecryptionResult> {
  if (variants.length === 0) {
    return { success: false };
  }

  // Randomize variant order to prevent timing attacks
  const shuffledVariants = [...variants].sort(() => Math.random() - 0.5);

  // Attempt decryption for each variant
  for (const variant of shuffledVariants) {
    try {
      // Convert hex strings to Uint8Array
      const salt = hexToUint8Array(variant.salt);
      const iv = hexToUint8Array(variant.iv);

      // Derive key
      const key = await deriveKey(password, {
        salt,
        iterations: variant.kdf_iterations,
        hash: variant.kdf_hash as 'SHA-256',
      });

      // Decrypt content
      const decryptedString = await decrypt(variant.encrypted_content, { key, iv });

      // Parse JSON content
      const content = JSON.parse(decryptedString) as EditorJSContent;

      // Success - return first successful decryption
      return {
        success: true,
        content,
        variant_id: variant.id,
      };
    } catch (error) {
      // Decryption failed for this variant - try next one
      continue;
    }
  }

  // All decryption attempts failed
  return { success: false };
}

/**
 * Re-encrypt content with the same password (for content updates)
 * @param password - Current password
 * @param content - Updated content
 * @param existingVariant - Existing variant to update
 * @returns New encryption result (new salt/IV for security)
 */
export async function reEncryptContent(
  password: string,
  content: EditorJSContent,
  existingVariant: NoteEncryptionVariant
): Promise<EncryptionResult> {
  // Use same KDF iterations as existing variant
  const kdfIterations = existingVariant.kdf_iterations;

  // Generate new salt and IV for security (even with same password)
  const salt = generateSalt();
  const iv = generateIV();

  // Convert content to JSON string
  const contentString = JSON.stringify(content);

  // Derive key from password
  const key = await deriveKey(password, {
    salt,
    iterations: kdfIterations,
    hash: 'SHA-256',
  });

  // Encrypt content
  const encryptedContent = await encrypt(contentString, { key, iv });

  return {
    encrypted_content: encryptedContent,
    salt,
    iv,
    kdf_iterations: kdfIterations,
  };
}

/**
 * Re-encrypt content with a new password
 * @param oldPassword - Current password (for validation)
 * @param newPassword - New password
 * @param content - Content to re-encrypt
 * @param existingVariant - Existing variant
 * @param newKdfIterations - Optional new iteration count
 * @returns New encryption result
 */
export async function reEncryptWithNewPassword(
  oldPassword: string,
  newPassword: string,
  content: EditorJSContent,
  existingVariant: NoteEncryptionVariant,
  newKdfIterations?: number
): Promise<EncryptionResult> {
  // First, verify old password by attempting decryption
  const decryptResult = await decryptNoteVariants(oldPassword, [existingVariant]);
  if (!decryptResult.success || !decryptResult.content) {
    throw new Error('Invalid current password');
  }

  // Use new iterations if provided, otherwise keep existing
  const kdfIterations = newKdfIterations ?? existingVariant.kdf_iterations;

  // Generate new salt and IV
  const salt = generateSalt();
  const iv = generateIV();

  // Convert content to JSON string
  const contentString = JSON.stringify(content);

  // Derive key from new password
  const key = await deriveKey(newPassword, {
    salt,
    iterations: kdfIterations,
    hash: 'SHA-256',
  });

  // Encrypt content
  const encryptedContent = await encrypt(contentString, { key, iv });

  return {
    encrypted_content: encryptedContent,
    salt,
    iv,
    kdf_iterations: kdfIterations,
  };
}

// Utility function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Utility function to convert Uint8Array to hex string
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility function to convert Uint8Array to base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  return btoa(binary);
}

