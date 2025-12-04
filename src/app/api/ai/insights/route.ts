// AI Insights API Route
// POST /api/ai/insights

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queryAI } from '@/lib/ai-insights/service';
import { createAIQuery, updateAIQuery } from '@/lib/ai-insights/queries';
import { extractNoteText, truncateNotesForTokenLimit, formatNotesForAI } from '@/lib/ai-insights/utils';
import type { AIQueryRequest, AIQueryResponse, AIQueryError, SimplifiedNote } from '@/lib/ai-insights/types';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        details: 'User must be authenticated to access AI insights'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse and validate request
    let requestData: AIQueryRequest;
    try {
      requestData = await request.json();
    } catch {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'body', message: 'Invalid JSON body' }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { query, noteIds, model = 'gpt-4' } = requestData;

    // Validate required fields
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'query', message: 'Query is required and must be non-empty' }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0 || noteIds.length > 50) {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'noteIds', message: 'noteIds must be an array with 1-50 valid UUIDs' }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate query length
    if (query.length > 1000) {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'query', message: 'Query must be 1000 characters or less' }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Retrieve and validate notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .in('id', noteIds)
      .eq('user_id', user.id);

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'noteIds', message: 'Failed to validate notes' }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!notes || notes.length !== noteIds.length) {
      const errorResponse: AIQueryError = {
        success: false,
        error: 'VALIDATION_ERROR',
        details: { field: 'noteIds', message: 'One or more notes not found or not accessible' }
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Create AI query record
    const queryRecord = await createAIQuery({
      queryText: query.trim(),
      selectedNoteIds: noteIds,
      aiModel: model
    });

    // Process notes for AI context
    const notesForAI: SimplifiedNote[] = notes.map(note => ({
      title: note.title,
      content: extractNoteText(note.content),
      created_at: note.created_at
    }));

    // Check token limits and truncate if needed
    const truncationResult = await truncateNotesForTokenLimit(notesForAI, 6000);

    // Format context for AI
    const context = formatNotesForAI(truncationResult.notes);

    // Query AI service
    try {
      const aiResult = await queryAI(context, query.trim(), model);

      // Update query record with success
      await updateAIQuery(queryRecord.id, {
        tokenCount: aiResult.tokenCount,
        status: 'completed',
        responseText: aiResult.response,
        processingTimeMs: aiResult.processingTime
      });

      const successResponse: AIQueryResponse = {
        success: true,
        data: {
          queryId: queryRecord.id,
          response: aiResult.response,
          tokenCount: aiResult.tokenCount,
          processingTime: aiResult.processingTime,
          notesAnalyzed: truncationResult.notes.length,
          totalNotesSelected: notes.length,
          truncationInfo: {
            wasTruncated: truncationResult.truncated,
            notesRemoved: truncationResult.removedCount,
            tokenCount: truncationResult.tokenCount
          }
        }
      };

      return NextResponse.json(successResponse);

    } catch (aiError) {
      console.error('AI service error:', aiError);

      // Update query record with failure
      await updateAIQuery(queryRecord.id, {
        status: 'failed',
        errorMessage: aiError instanceof Error ? aiError.message : 'Unknown AI service error'
      });

      const errorResponse: AIQueryError = {
        success: false,
        error: 'AI_SERVICE_ERROR',
        details: aiError instanceof Error ? aiError.message : 'AI service temporarily unavailable'
      };

      return NextResponse.json(errorResponse, { status: 503 });
    }

  } catch (error) {
    console.error('AI Insights API error:', error);

    const errorResponse: AIQueryError = {
      success: false,
      error: 'INTERNAL_ERROR',
      details: 'Failed to process AI insights request'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Optional: GET endpoint for retrieving query history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const { queries, total } = await import('@/lib/ai-insights/queries').then(m => m.getUserAIQueries(limit, offset));

    return NextResponse.json({
      success: true,
      data: {
        queries,
        total,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('AI Insights GET error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
