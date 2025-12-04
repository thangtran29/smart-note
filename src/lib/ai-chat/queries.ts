import { createClient } from '@/lib/supabase/server';
import type { AIConversation } from './types';

export async function getConversationsByNoteId(noteId: string): Promise<AIConversation[]> {
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('note_id', noteId)
    .eq('user_id', user.id) // Ensure we only get user's own conversations
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Transform snake_case to camelCase to match TypeScript interface
  return (data || []).map(item => ({
    id: item.id,
    noteId: item.note_id,
    userId: item.user_id,
    userMessage: item.user_message,
    aiResponse: item.ai_response,
    createdAt: item.created_at,
  }));
}

export async function createConversation(
  noteId: string,
  userMessage: string,
  aiResponse: string
): Promise<AIConversation> {
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      note_id: noteId,
      user_id: user.id,
      user_message: userMessage,
      ai_response: aiResponse,
    })
    .select()
    .single();

  if (error) throw error;

  // Transform snake_case to camelCase to match TypeScript interface
  return {
    id: data.id,
    noteId: data.note_id,
    userId: data.user_id,
    userMessage: data.user_message,
    aiResponse: data.ai_response,
    createdAt: data.created_at,
  };
}

export async function deleteConversationsByNoteId(noteId: string): Promise<void> {
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('note_id', noteId)
    .eq('user_id', user.id); // Ensure we only delete user's own conversations

  if (error) throw error;
}
