import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getConversationsByNoteId, createConversation } from '@/lib/ai-chat/queries';
import { extractNoteText, formatAIContext } from '@/lib/ai-chat/utils';
import type { SendMessageRequest } from '@/lib/ai-chat/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
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

    // Parse request
    const body: SendMessageRequest = await request.json();
    const { noteId, message } = body;

    if (!noteId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Note ID and message are required' },
        { status: 400 }
      );
    }

    // Verify note access
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, title, content')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { success: false, error: 'Note not found or access denied' },
        { status: 403 }
      );
    }

    // Get existing conversations for context
    const existingConversations = await getConversationsByNoteId(noteId);

    // Extract note content for AI context
    const noteText = extractNoteText(note.content);
    const aiContext = formatAIContext(note.title, noteText);

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: aiContext },
      ...existingConversations.flatMap(conv => [
        // Only include messages with valid content
        ...(conv.userMessage ? [{ role: 'user' as const, content: conv.userMessage }] : []),
        ...(conv.aiResponse ? [{ role: 'assistant' as const, content: conv.aiResponse }] : []),
      ]),
      { role: 'user', content: message.trim() },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    // Store conversation
    const conversation = await createConversation(noteId, message.trim(), aiResponse);

    return NextResponse.json({
      success: true,
      conversation,
    });

  } catch (error) {
    console.error('AI Chat API error:', error);

    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { success: false, error: `AI service error: ${error.message}` },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
