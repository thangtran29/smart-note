import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConversationsByNoteId, deleteConversationsByNoteId } from '@/lib/ai-chat/queries';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get noteId from query params
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify note access
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { success: false, error: 'Note not found or access denied' },
        { status: 403 }
      );
    }

    // Get conversation history
    const conversations = await getConversationsByNoteId(noteId);

    return NextResponse.json({
      success: true,
      conversations,
    });

  } catch (error) {
    console.error('AI Chat history API error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to load conversation history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get noteId from query params
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify note access
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { success: false, error: 'Note not found or access denied' },
        { status: 403 }
      );
    }

    // Delete conversation history
    await deleteConversationsByNoteId(noteId);

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('AI Chat clear history API error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to clear conversation history' },
      { status: 500 }
    );
  }
}
