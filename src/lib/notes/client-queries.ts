import { createClient } from '@/lib/supabase/client';
import type { Note } from '@/lib/supabase/types';
import type { NoteSearchParams, NoteSearchResponse } from '@/lib/search/types';

export async function getNotes(): Promise<Note[]> {
  const supabase = createClient();
  
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
  const supabase = createClient();
  
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

export async function searchNotes(params: NoteSearchParams): Promise<NoteSearchResponse> {
  const response = await fetch('/api/search/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Search failed: ${response.status}`);
  }

  return response.json();
}
