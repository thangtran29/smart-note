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
