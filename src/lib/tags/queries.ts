import { createClient } from '@/lib/supabase/server';
import type { Tag, TagWithCount, NoteWithTags, TagFilter } from '@/lib/tags/types';

// Type for tag query result with note_tags count
interface TagWithNoteTagsCount {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  note_tags: unknown[] | null; // Count aggregation returns array
}

// Type for note query result with joined tags
interface NoteWithJoinedTags {
  id: string;
  user_id: string;
  title: string;
  content: unknown; // EditorJSContent | null
  created_at: string;
  updated_at: string;
  note_tags: Array<{
    tags: Tag | null;
  }> | null;
}

export async function getTags(): Promise<TagWithCount[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('tags')
    .select(`
      *,
      note_tags(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  // Transform the data to include note_count
  return (data || []).map((tag: TagWithNoteTagsCount): TagWithCount => ({
    id: tag.id,
    user_id: tag.user_id,
    name: tag.name,
    color: tag.color,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
    note_count: Array.isArray(tag.note_tags) ? tag.note_tags.length : 0,
  }));
}

export async function getNotesWithTags(
  filters?: TagFilter,
  limit = 50,
  offset = 0
): Promise<{ notes: NoteWithTags[]; total: number }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { notes: [], total: 0 };
  }

  let query = supabase
    .from('notes')
    .select(`
      *,
      note_tags(
        tags(*)
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply tag filters if provided
  if (filters?.tagIds && filters.tagIds.length > 0) {
    // For AND logic: note must have ALL specified tags
    // Filter notes that have all required tags
    query = query
      .select(`
        *,
        note_tags(
          tags(*)
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // Execute query without pagination for filtering
    const filteredResult = await query;

    if (filteredResult.error) {
      console.error('Error fetching notes with tags:', filteredResult.error);
      return { notes: [], total: 0 };
    }

    // Filter notes client-side: note must have ALL specified tags
    const filteredNotes = (filteredResult.data || []).filter((note: NoteWithJoinedTags) => {
      const noteTagIds: string[] = (note.note_tags || []).map((nt) => nt.tags?.id).filter((id: string | undefined): id is string => Boolean(id));
      return filters.tagIds!.every((tagId: string) => noteTagIds.includes(tagId));
    });

    // Apply pagination to filtered results
    const paginatedNotes = filteredNotes.slice(offset, offset + limit);

    // Transform the data to flatten tags
    const notes: NoteWithTags[] = paginatedNotes.map((note: NoteWithJoinedTags): NoteWithTags => ({
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
      tags: (note.note_tags || [])
        .map((nt) => nt.tags)
        .filter((tag: Tag | null): tag is Tag => Boolean(tag)),
    }));

    return {
      notes,
      total: filteredNotes.length,
    };
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching notes with tags:', error);
    return { notes: [], total: 0 };
  }

  // Transform the data to flatten tags
  const notes: NoteWithTags[] = (data || []).map((note: NoteWithJoinedTags): NoteWithTags => ({
    id: note.id,
    user_id: note.user_id,
    title: note.title,
    content: note.content,
    created_at: note.created_at,
    updated_at: note.updated_at,
    tags: (note.note_tags || [])
      .map((nt) => nt.tags)
      .filter((tag: Tag | null): tag is Tag => Boolean(tag)),
  }));

  return {
    notes,
    total: count || 0,
  };
}
