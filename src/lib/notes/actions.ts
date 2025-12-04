'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EditorJSContent, ActionResult } from '@/lib/notes/types';
import type { Note } from '@/lib/supabase/types';

interface CreateNoteInput {
  title?: string;
  content?: EditorJSContent;
}

interface UpdateNoteInput {
  title?: string;
  content?: EditorJSContent;
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

  const insertData = {
    user_id: user.id,
    title: input.title ?? '',
    content: input.content ?? { time: 0, blocks: [], version: '2.28.0' },
  };

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

  const updateData: { title?: string; content?: EditorJSContent } = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;

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
  input: CreateNoteInput & { tagIds?: string[] }
): Promise<ActionResult<{ note: Note }>> {
  const result = await createNote(input);

  if (result.success && input.tagIds && input.tagIds.length > 0) {
    // Import tag actions here to avoid circular dependency
    const { assignTagsToNote } = await import('@/lib/tags/actions');
    await assignTagsToNote(result.note.id, input.tagIds);
  }

  return result;
}

export async function updateNoteWithTags(
  id: string,
  input: UpdateNoteInput & { tagIds?: string[] }
): Promise<ActionResult<{ note: Note }>> {
  const result = await updateNote(id, input);

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
