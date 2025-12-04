'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateTagInput,
  UpdateTagInput,
  CreateTagResult,
  UpdateTagResult,
  DeleteTagResult,
  AssignTagsResult,
  RemoveTagResult,
} from '@/lib/tags/types';

export async function createTag(input: CreateTagInput): Promise<CreateTagResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color ?? '#3B82F6',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Tag name already exists' };
    }
    return { success: false, error: 'Failed to create tag' };
  }

  revalidatePath('/tags');
  return { success: true, tag: data };
}

export async function updateTag(
  id: string,
  input: UpdateTagInput
): Promise<UpdateTagResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('tags')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tag:', error);
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Tag name already exists' };
    }
    return { success: false, error: 'Failed to update tag' };
  }

  revalidatePath('/tags');
  return { success: true, tag: data };
}

export async function deleteTag(id: string): Promise<DeleteTagResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if tag is assigned to any notes
  const { data: assignments } = await supabase
    .from('note_tags')
    .select('note_id')
    .eq('tag_id', id);

  if (assignments && assignments.length > 0) {
    return { success: false, error: 'Tag is assigned to notes' };
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting tag:', error);
    return { success: false, error: 'Failed to delete tag' };
  }

  revalidatePath('/tags');
  return { success: true };
}

export async function assignTagsToNote(
  noteId: string,
  tagIds: string[]
): Promise<AssignTagsResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note belongs to user
  const { data: note } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (!note) {
    return { success: false, error: 'Note not found' };
  }

  // Verify all tags belong to user
  const { data: tags } = await supabase
    .from('tags')
    .select('id')
    .in('id', tagIds)
    .eq('user_id', user.id);

  if (!tags || tags.length !== tagIds.length) {
    return { success: false, error: 'Invalid tag IDs' };
  }

  // Insert note-tag associations (ignore duplicates)
  const assignments = tagIds.map(tagId => ({
    note_id: noteId,
    tag_id: tagId,
  }));

  const { error } = await supabase
    .from('note_tags')
    .upsert(assignments, { onConflict: 'note_id,tag_id' });

  if (error) {
    console.error('Error assigning tags:', error);
    return { success: false, error: 'Failed to assign tags' };
  }

  revalidatePath('/notes');
  revalidatePath(`/notes/${noteId}`);
  return { success: true };
}

export async function removeTagFromNote(
  noteId: string,
  tagId: string
): Promise<RemoveTagResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify note and tag belong to user
  const { data: note } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (!note) {
    return { success: false, error: 'Note not found' };
  }

  const { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', user.id)
    .single();

  if (!tag) {
    return { success: false, error: 'Tag not found' };
  }

  const { error } = await supabase
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag:', error);
    return { success: false, error: 'Failed to remove tag' };
  }

  revalidatePath('/notes');
  revalidatePath(`/notes/${noteId}`);
  return { success: true };
}
