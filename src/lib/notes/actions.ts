'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EditorJSContent, ActionResult } from '@/lib/notes/types';
import type { Note } from '@/lib/supabase/types';

interface CreateNoteInput {
  title?: string;
  content?: EditorJSContent;
  expires_at?: Date | string | null;
}

interface UpdateNoteInput {
  title?: string;
  content?: EditorJSContent;
  expires_at?: Date | string | null;
}

type CreateNoteResult = { success: true; note: Note } | { success: false; error: string };
type UpdateNoteResult = { success: true; note: Note } | { success: false; error: string };
type DeleteNoteResult = { success: true } | { success: false; error: string };

export async function createNote(input: CreateNoteInput): Promise<CreateNoteResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const insertData: {
    user_id: string;
    title: string;
    content: EditorJSContent;
    expires_at?: string | null;
  } = {
    user_id: user.id,
    title: input.title ?? '',
    content: input.content ?? { time: 0, blocks: [], version: '2.28.0' },
  };

  // Handle expiration date - convert Date to ISO string if provided
  if (input.expires_at !== undefined) {
    if (input.expires_at === null) {
      insertData.expires_at = null;
    } else {
      const expiresAt = typeof input.expires_at === 'string' 
        ? new Date(input.expires_at) 
        : input.expires_at;
      insertData.expires_at = expiresAt.toISOString();
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return { success: false, error: 'Failed to create note' };
  }

  revalidatePath('/notes');
  return { success: true, note: data as Note };
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<UpdateNoteResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: {
    title?: string;
    content?: EditorJSContent;
    expires_at?: string | null;
  } = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  
  // Handle expiration date - convert Date to ISO string if provided
  if (input.expires_at !== undefined) {
    if (input.expires_at === null) {
      updateData.expires_at = null;
    } else {
      const expiresAt = typeof input.expires_at === 'string' 
        ? new Date(input.expires_at) 
        : input.expires_at;
      updateData.expires_at = expiresAt.toISOString();
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updateData as never)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return { success: false, error: 'Failed to update note' };
  }

  revalidatePath('/notes');
  revalidatePath(`/notes/${id}`);
  return { success: true, note: data as Note };
}

export async function deleteNote(id: string): Promise<DeleteNoteResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }

  revalidatePath('/notes');
  return { success: true };
}

// Tag operations for notes
export async function createNoteWithTags(
  input: CreateNoteInput & { tagIds?: string[]; expires_at?: Date | string | null }
): Promise<ActionResult<{ note: Note }>> {
  const { tagIds, expires_at, ...noteInput } = input;
  const result = await createNote({ ...noteInput, expires_at });

  if (result.success && input.tagIds && input.tagIds.length > 0) {
    // Import tag actions here to avoid circular dependency
    const { assignTagsToNote } = await import('@/lib/tags/actions');
    await assignTagsToNote(result.note.id, input.tagIds);
  }

  return result;
}

export async function updateNoteWithTags(
  id: string,
  input: UpdateNoteInput & { tagIds?: string[]; expires_at?: Date | string | null }
): Promise<ActionResult<{ note: Note }>> {
  const { tagIds, expires_at, ...noteInput } = input;
  const result = await updateNote(id, { ...noteInput, expires_at });

  if (result.success && input.tagIds !== undefined) {
    // Import tag actions here to avoid circular dependency
    const { assignTagsToNote } = await import('@/lib/tags/actions');

    if (input.tagIds.length === 0) {
      // Remove all tags from note
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      await supabase.from('note_tags').delete().eq('note_id', id);
    } else {
      // Assign new tags (this will replace existing ones)
      await assignTagsToNote(id, input.tagIds);
    }
  }

  return result;
}

// Password protection operations
export interface EnablePasswordProtectionInput {
  note_id: string;
  encrypted_content: string;   // Base64 encoded, already encrypted client-side
  salt: string;                // Hex string (16 bytes)
  iv: string;                  // Hex string (12 bytes)
  kdf_iterations: number;
}

type EnablePasswordProtectionResult = 
  | { success: true; variant: { id: string; note_id: string; encrypted_content: string; salt: string; iv: string; kdf_type: 'pbkdf2'; kdf_iterations: number; kdf_hash: 'SHA-256'; created_at: string } }
  | { success: false; error: string };

export async function enablePasswordProtection(
  input: EnablePasswordProtectionInput
): Promise<EnablePasswordProtectionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note ownership
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id')
    .eq('id', input.note_id)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    return { success: false, error: 'Note not found' };
  }

  // Check variant count (max 10)
  const { count } = await supabase
    .from('note_encryption_variants')
    .select('*', { count: 'exact', head: true })
    .eq('note_id', input.note_id);

  if (count !== null && count >= 10) {
    return { success: false, error: 'Maximum 10 password variants allowed per note' };
  }

  // Insert variant
  // Use hex format with \x prefix for BYTEA (PostgreSQL native format)
  const saltHex = `\\x${input.salt}`;
  const ivHex = `\\x${input.iv}`;
  
  const { data: variant, error: variantError } = await supabase
    .from('note_encryption_variants')
    .insert({
      note_id: input.note_id,
      encrypted_content: input.encrypted_content,
      salt: saltHex,
      iv: ivHex,
      kdf_type: 'pbkdf2',
      kdf_iterations: input.kdf_iterations,
      kdf_hash: 'SHA-256',
    } as never)
    .select()
    .single();

  if (variantError) {
    console.error('Error creating encryption variant:', variantError);
    return { success: false, error: 'Failed to enable password protection' };
  }

  revalidatePath(`/notes/${input.note_id}`);
  return { 
    success: true, 
    variant: {
      id: variant.id,
      note_id: variant.note_id,
      encrypted_content: variant.encrypted_content,
      salt: variant.salt,
      iv: variant.iv,
      kdf_type: variant.kdf_type as 'pbkdf2',
      kdf_iterations: variant.kdf_iterations,
      kdf_hash: variant.kdf_hash as 'SHA-256',
      created_at: variant.created_at,
    }
  };
}

export interface UpdatePasswordVariantInput {
  variant_id: string;
  encrypted_content?: string;    // If content changed, new encrypted content
  salt?: string;                 // If password changed, new salt
  iv?: string;                   // If content/password changed, new IV
  kdf_iterations?: number;       // If password changed, new iterations
}

type UpdatePasswordVariantResult = 
  | { success: true; variant: { id: string; note_id: string; encrypted_content: string; salt: string; iv: string; kdf_type: 'pbkdf2'; kdf_iterations: number; kdf_hash: 'SHA-256'; created_at: string } }
  | { success: false; error: string };

export async function updatePasswordVariant(
  input: UpdatePasswordVariantInput
): Promise<UpdatePasswordVariantResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify variant ownership via note ownership
  const { data: variant, error: variantError } = await supabase
    .from('note_encryption_variants')
    .select(`
      *,
      notes!inner(id, user_id)
    `)
    .eq('id', input.variant_id)
    .eq('notes.user_id', user.id)
    .single();

  if (variantError || !variant) {
    return { success: false, error: 'Variant not found' };
  }

  // Build update data
  const updateData: {
    encrypted_content?: string;
    salt?: string;
    iv?: string;
    kdf_iterations?: number;
  } = {};

  if (input.encrypted_content !== undefined) {
    updateData.encrypted_content = input.encrypted_content;
  }
  if (input.salt !== undefined) {
    updateData.salt = input.salt;
  }
  if (input.iv !== undefined) {
    updateData.iv = input.iv;
  }
  if (input.kdf_iterations !== undefined) {
    updateData.kdf_iterations = input.kdf_iterations;
  }

  // Convert hex strings to PostgreSQL BYTEA format if provided
  const finalUpdateData: typeof updateData & { salt?: string; iv?: string } = { ...updateData };
  if (input.salt !== undefined) {
    finalUpdateData.salt = `\\x${input.salt}`;
  }
  if (input.iv !== undefined) {
    finalUpdateData.iv = `\\x${input.iv}`;
  }

  // Update variant
  const { data: updatedVariant, error: updateError } = await supabase
    .from('note_encryption_variants')
    .update(finalUpdateData as never)
    .eq('id', input.variant_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating variant:', updateError);
    return { success: false, error: 'Failed to update variant' };
  }

  revalidatePath(`/notes/${variant.note_id}`);
  return { 
    success: true, 
    variant: {
      id: updatedVariant.id,
      note_id: updatedVariant.note_id,
      encrypted_content: updatedVariant.encrypted_content,
      salt: updatedVariant.salt,
      iv: updatedVariant.iv,
      kdf_type: updatedVariant.kdf_type as 'pbkdf2',
      kdf_iterations: updatedVariant.kdf_iterations,
      kdf_hash: updatedVariant.kdf_hash as 'SHA-256',
      created_at: updatedVariant.created_at,
    }
  };
}

export interface AddPasswordVariantInput {
  note_id: string;
  encrypted_content: string;   // Base64 encoded, already encrypted client-side
  salt: string;                // Hex string (16 bytes)
  iv: string;                  // Hex string (12 bytes)
  kdf_iterations: number;
}

type AddPasswordVariantResult = 
  | { success: true; variant: { id: string; note_id: string; encrypted_content: string; salt: string; iv: string; kdf_type: 'pbkdf2'; kdf_iterations: number; kdf_hash: 'SHA-256'; created_at: string } }
  | { success: false; error: string };

export async function addPasswordVariant(
  input: AddPasswordVariantInput
): Promise<AddPasswordVariantResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note ownership
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id')
    .eq('id', input.note_id)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    return { success: false, error: 'Note not found' };
  }

  // Check variant count (max 10)
  const { count } = await supabase
    .from('note_encryption_variants')
    .select('*', { count: 'exact', head: true })
    .eq('note_id', input.note_id);

  if (count !== null && count >= 10) {
    return { success: false, error: 'Maximum 10 password variants allowed per note' };
  }

  // Insert variant
  // Use hex format with \x prefix for BYTEA (PostgreSQL native format)
  const saltHex = `\\x${input.salt}`;
  const ivHex = `\\x${input.iv}`;
  
  const { data: variant, error: variantError } = await supabase
    .from('note_encryption_variants')
    .insert({
      note_id: input.note_id,
      encrypted_content: input.encrypted_content,
      salt: saltHex,
      iv: ivHex,
      kdf_type: 'pbkdf2',
      kdf_iterations: input.kdf_iterations,
      kdf_hash: 'SHA-256',
    } as never)
    .select()
    .single();

  if (variantError) {
    console.error('Error creating variant:', variantError);
    return { success: false, error: 'Failed to add variant' };
  }

  revalidatePath(`/notes/${input.note_id}`);
  return { 
    success: true, 
    variant: {
      id: variant.id,
      note_id: variant.note_id,
      encrypted_content: variant.encrypted_content,
      salt: variant.salt,
      iv: variant.iv,
      kdf_type: variant.kdf_type as 'pbkdf2',
      kdf_iterations: variant.kdf_iterations,
      kdf_hash: variant.kdf_hash as 'SHA-256',
      created_at: variant.created_at,
    }
  };
}

type DeletePasswordVariantResult = 
  | { success: true }
  | { success: false; error: string };

export async function deletePasswordVariant(
  variantId: string
): Promise<DeletePasswordVariantResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify variant ownership via note ownership
  const { data: variant, error: variantError } = await supabase
    .from('note_encryption_variants')
    .select(`
      *,
      notes!inner(id, user_id)
    `)
    .eq('id', variantId)
    .eq('notes.user_id', user.id)
    .single();

  if (variantError || !variant) {
    return { success: false, error: 'Variant not found' };
  }

  // Delete variant
  const { error: deleteError } = await supabase
    .from('note_encryption_variants')
    .delete()
    .eq('id', variantId);

  if (deleteError) {
    console.error('Error deleting variant:', deleteError);
    return { success: false, error: 'Failed to delete variant' };
  }

  revalidatePath(`/notes/${variant.note_id}`);
  return { success: true };
}

type DisablePasswordProtectionResult = 
  | { success: true }
  | { success: false; error: string };

export async function disablePasswordProtection(
  noteId: string
): Promise<DisablePasswordProtectionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note ownership
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    return { success: false, error: 'Note not found' };
  }

  // Delete all variants (CASCADE will handle this, but explicit delete is clearer)
  const { error: deleteError } = await supabase
    .from('note_encryption_variants')
    .delete()
    .eq('note_id', noteId);

  if (deleteError) {
    console.error('Error disabling password protection:', deleteError);
    return { success: false, error: 'Failed to disable password protection' };
  }

  revalidatePath(`/notes/${noteId}`);
  return { success: true };
}