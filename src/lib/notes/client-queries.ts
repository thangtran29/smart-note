import type { Note } from '@/lib/supabase/types';
import type { NoteSearchParams, NoteSearchResponse } from '@/lib/search/types';
import type { NoteEncryptionVariant } from './encryption/types';

export async function getNotes(): Promise<Note[]> {
  try {
    const response = await fetch('/api/notes/list');
    
    if (!response.ok) {
      console.error('Error fetching notes:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.notes ?? [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
}

export async function getNote(id: string): Promise<Note | null> {
  try {
    const response = await fetch(`/api/notes/${id}`);
    
    if (!response.ok) {
      console.error('Error fetching note:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.note ?? null;
  } catch (error) {
    console.error('Error fetching note:', error);
    return null;
  }
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

export async function getNoteVariants(noteId: string): Promise<{ success: true; variants: NoteEncryptionVariant[]; realVariantCount?: number } | { success: false; error: string }> {
  try {
    const response = await fetch(`/api/notes/${noteId}/variants`);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Unable to unlock content' };
    }

    const data = await response.json();
    return { 
      success: true, 
      variants: data.variants,
      realVariantCount: data.realVariantCount // Real count from database (not including fake variants)
    };
  } catch (error) {
    console.error('Error fetching variants:', error);
    return { success: false, error: 'Unable to unlock content' };
  }
}
