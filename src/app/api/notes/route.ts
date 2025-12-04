import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EditorJSContent } from '@/lib/notes/types';
import type { NoteSearchResult } from '@/lib/search/types';

interface NoteWithTags {
  id: string;
  title: string;
  content: EditorJSContent;
  created_at: string;
  note_tags: Array<{
    tags: {
      id: string;
      name: string;
      color: string;
    } | null;
  }> | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tagIds = searchParams.getAll('tag');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Build query
    let query = supabase
      .from('notes')
      .select(`
        id,
        title,
        content,
        created_at,
        note_tags(
          tags(
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add date filtering
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Execute query first to get all potential notes
    const { data: notes, error } = await query;

    if (error) {
      console.error('Notes query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    let filteredNotes = (notes as unknown as NoteWithTags[]) || [];

    // Apply tag filtering (AND logic - note must have ALL selected tags)
    if (tagIds.length > 0) {
      filteredNotes = filteredNotes.filter(note => {
        const noteTagIds = (note.note_tags || [])
          .map((nt: { tags: { id: string; name: string; color: string } | null }) => nt.tags?.id)
          .filter(Boolean);

        // Note must contain ALL selected tags
        return tagIds.every(tagId => noteTagIds.includes(tagId));
      });
    }

    // Transform to NoteSearchResult format
    const noteResults: NoteSearchResult[] = filteredNotes.map(note => ({
      id: note.id,
      user_id: user.id, // Add user_id from authenticated user
      title: note.title || '',
      content: note.content, // Keep as EditorJSContent
      created_at: note.created_at,
      updated_at: note.created_at, // Use created_at as updated_at for simplicity
      tags: (note.note_tags || [])
        .map((nt) => nt.tags)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    }));

    return NextResponse.json({
      notes: noteResults,
      total: noteResults.length,
      appliedFilters: {
        tagIds,
        dateFrom,
        dateTo
      }
    });

  } catch (error) {
    console.error('Notes preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
