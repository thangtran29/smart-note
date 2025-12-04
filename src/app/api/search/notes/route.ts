import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSearchParams, presetToDateRange } from '@/lib/search/utils';
import { extractNoteText } from '@/lib/notes/utils';
import type { NoteSearchParams, NoteSearchResponse, DateFilterPreset } from '@/lib/search/types';
import type { EditorJSContent } from '@/lib/notes/types';

// Types for the joined data from Supabase
interface NoteTagJoin {
  tags: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface NoteWithTags {
  id: string;
  user_id: string;
  title: string;
  content: EditorJSContent;
  created_at: string;
  updated_at: string;
  note_tags: NoteTagJoin[] | null;
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let params: Partial<NoteSearchParams & { datePreset?: DateFilterPreset }>;
    try {
      params = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Convert date preset to date range if provided
    if (params.datePreset && params.datePreset !== 'custom') {
      const dateRange = presetToDateRange(params.datePreset);
      if (dateRange) {
        params.dateFrom = dateRange.from.toISOString();
        params.dateTo = dateRange.to.toISOString();
      }
    }

    // Validate search parameters
    const validatedParams = validateSearchParams(params);

    // Set defaults
    const limit = validatedParams.limit ?? 50;
    const offset = validatedParams.offset ?? 0;

    // Build the search query
    let query = supabase
      .from('notes')
      .select(`
        *,
        note_tags(
          tags(*)
        )
      `)
      .eq('user_id', user.id);

    // Add search conditions if query provided
    if (validatedParams.query) {
      const searchTerm = validatedParams.query;

      // Use both title and content search
      query = query.or(
        `title.ilike.%${searchTerm}%,` +
        `to_tsvector('english', extract_note_text(content)) @@ plainto_tsquery('english', '${searchTerm.replace(/'/g, "''")}')`
      );
    }

    // Add date filtering
    if (validatedParams.dateFrom) {
      query = query.gte('updated_at', validatedParams.dateFrom);
    }
    if (validatedParams.dateTo) {
      query = query.lte('updated_at', validatedParams.dateTo);
    }

    // Add tag filtering (AND logic)
    if (validatedParams.tagIds && validatedParams.tagIds.length > 0) {
      // For now, we'll skip tag filtering as it requires joining with note_tags
      // This will be implemented when we add tag support
      console.warn('Tag filtering not yet implemented');
    }

    // Add ordering and pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: notes, error, count } = await query;

    if (error) {
      console.error('Search query error:', error);
      return NextResponse.json(
        { error: 'Search operation failed', message: error.message },
        { status: 500 }
      );
    }

    // Calculate search time
    const searchTime = Date.now() - startTime;

    // Build response
    const response: NoteSearchResponse = {
      notes: (notes as NoteWithTags[] ?? []).map((note: NoteWithTags) => {
        const matchedFields: string[] = [];

        if (validatedParams.query) {
          // Determine which fields matched
          const titleMatch = note.title.toLowerCase().includes(validatedParams.query!.toLowerCase());
          const contentText = extractNoteText(note.content);
          const contentMatch = contentText.toLowerCase().includes(validatedParams.query!.toLowerCase());

          if (titleMatch) matchedFields.push('title');
          if (contentMatch) matchedFields.push('content');
        }

        return {
          ...note,
          tags: (note.note_tags || [])
            .map((nt: NoteTagJoin) => nt.tags)
            .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
          searchRank: matchedFields.includes('title') ? 1.0 : 0.8, // Title matches rank higher
          matchedFields
        };
      }),
      metadata: {
        total: count ?? 0,
        searchTime,
        appliedFilters: {
          query: validatedParams.query,
          dateFrom: validatedParams.dateFrom,
          dateTo: validatedParams.dateTo,
          tagIds: validatedParams.tagIds
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
