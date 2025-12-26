/**
 * Logging utilities for encryption operations
 * Never logs sensitive data (passwords, keys, plaintext content)
 */

type LogLevel = 'info' | 'warn' | 'error';

interface EncryptionLogEntry {
  level: LogLevel;
  operation: string;
  noteId?: string;
  variantId?: string;
  message: string;
  error?: string;
  timestamp: string;
}

/**
 * Log encryption operation (without sensitive data)
 */
export function logEncryptionOperation(
  level: LogLevel,
  operation: string,
  message: string,
  metadata?: {
    noteId?: string;
    variantId?: string;
    error?: Error | string;
  }
): void {
  const entry: EncryptionLogEntry = {
    level,
    operation,
    noteId: metadata?.noteId,
    variantId: metadata?.variantId,
    message,
    error: metadata?.error instanceof Error ? metadata.error.message : metadata?.error,
    timestamp: new Date().toISOString(),
  };

  // Only log in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[Encryption ${level.toUpperCase()}] ${operation}:`, {
      message,
      ...(metadata?.noteId && { noteId: metadata.noteId }),
      ...(metadata?.variantId && { variantId: metadata.variantId }),
      ...(metadata?.error && { error: metadata.error instanceof Error ? metadata.error.message : metadata.error }),
      timestamp: entry.timestamp,
    });
  }

  // In production, could send to logging service (without sensitive data)
  // Example: sendToLoggingService(entry);
}

/**
 * Log encryption start
 */
export function logEncryptionStart(noteId: string, variantId?: string): void {
  logEncryptionOperation('info', 'encrypt', 'Encryption started', { noteId, variantId });
}

/**
 * Log encryption success
 */
export function logEncryptionSuccess(noteId: string, variantId?: string): void {
  logEncryptionOperation('info', 'encrypt', 'Encryption completed successfully', { noteId, variantId });
}

/**
 * Log encryption error
 */
export function logEncryptionError(noteId: string, error: Error | string, variantId?: string): void {
  logEncryptionOperation('error', 'encrypt', 'Encryption failed', { noteId, variantId, error });
}

/**
 * Log decryption start
 */
export function logDecryptionStart(noteId: string): void {
  logEncryptionOperation('info', 'decrypt', 'Decryption started', { noteId });
}

/**
 * Log decryption success
 */
export function logDecryptionSuccess(noteId: string, variantId?: string): void {
  logEncryptionOperation('info', 'decrypt', 'Decryption completed successfully', { noteId, variantId });
}

/**
 * Log decryption error (generic - don't reveal if password was wrong)
 */
export function logDecryptionError(noteId: string, error: Error | string): void {
  logEncryptionOperation('warn', 'decrypt', 'Decryption failed', { noteId, error });
}

/**
 * Log variant operation
 */
export function logVariantOperation(
  operation: 'create' | 'update' | 'delete',
  noteId: string,
  variantId?: string,
  error?: Error | string
): void {
  const message = `Variant ${operation} ${error ? 'failed' : 'completed'}`;
  logEncryptionOperation(
    error ? 'error' : 'info',
    `variant_${operation}`,
    message,
    { noteId, variantId, error }
  );
}

