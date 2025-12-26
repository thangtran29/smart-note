import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/lib/supabase/types';
import type { NoteEncryptionVariant } from './encryption/types';

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data ?? [];
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    return null;
  }

  return data;
}

export async function getNoteVariants(noteId: string): Promise<{ success: true; variants: NoteEncryptionVariant[] } | { success: false; error: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note ownership first
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    // Don't reveal if note doesn't exist or user doesn't own it
    return { success: false, error: 'Unable to unlock content' };
  }

  // Fetch variants (RLS will enforce ownership)
  const { data: variants, error: variantsError } = await supabase
    .from('note_encryption_variants')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (variantsError) {
    console.error('Error fetching variants:', variantsError);
    return { success: false, error: 'Unable to unlock content' };
  }

  // Convert BYTEA fields (salt, iv) to hex strings
  // Supabase returns BYTEA as hex strings with \x prefix, or sometimes as base64
  const formattedVariants: NoteEncryptionVariant[] = (variants || []).map((v) => {
    // Handle salt: remove \x prefix if present, or convert from base64
    let saltHex = v.salt;
    if (saltHex.startsWith('\\x')) {
      saltHex = saltHex.substring(2); // Remove \x prefix
    } else if (saltHex.length > 32) {
      // Likely base64, convert to hex
      const binary = atob(saltHex);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      saltHex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Handle iv: remove \x prefix if present, or convert from base64
    let ivHex = v.iv;
    if (ivHex.startsWith('\\x')) {
      ivHex = ivHex.substring(2); // Remove \x prefix
    } else if (ivHex.length > 24) {
      // Likely base64, convert to hex
      const binary = atob(ivHex);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      ivHex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    return {
      id: v.id,
      note_id: v.note_id,
      encrypted_content: v.encrypted_content,
      salt: saltHex,
      iv: ivHex,
      kdf_type: v.kdf_type as 'pbkdf2',
      kdf_iterations: v.kdf_iterations,
      kdf_hash: v.kdf_hash as 'SHA-256',
      created_at: v.created_at,
    };
  });

  return { success: true, variants: formattedVariants };
}
