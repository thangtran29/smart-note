// AI Insights Database Operations

import { createClient } from '@/lib/supabase/server';
import type { AIQuery } from './types';

export interface CreateAIQueryData {
  queryText: string;
  selectedNoteIds: string[];
  aiModel: 'gpt-4' | 'gpt-3.5-turbo';
}

export interface UpdateAIQueryData {
  tokenCount?: number;
  status?: 'processing' | 'completed' | 'failed';
  responseText?: string;
  errorMessage?: string;
  processingTimeMs?: number;
}

/**
 * Create a new AI query record
 */
export async function createAIQuery(data: CreateAIQueryData): Promise<AIQuery> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: query, error } = await supabase
    .from('ai_queries')
    .insert({
      user_id: user.id,
      query_text: data.queryText,
      selected_note_ids: data.selectedNoteIds,
      ai_model: data.aiModel,
      status: 'processing'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating AI query:', error);
    throw new Error('Failed to create AI query record');
  }

  return query as AIQuery;
}

/**
 * Update an existing AI query record
 */
export async function updateAIQuery(id: string, data: UpdateAIQueryData): Promise<AIQuery> {
  const supabase = await createClient();

  const { data: query, error } = await supabase
    .from('ai_queries')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating AI query:', error);
    throw new Error('Failed to update AI query record');
  }

  return query as AIQuery;
}

/**
 * Get AI query by ID
 */
export async function getAIQuery(id: string): Promise<AIQuery | null> {
  const supabase = await createClient();

  const { data: query, error } = await supabase
    .from('ai_queries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching AI query:', error);
    throw new Error('Failed to fetch AI query');
  }

  return query as AIQuery;
}

/**
 * Get user's AI queries with pagination
 */
export async function getUserAIQueries(
  limit: number = 20,
  offset: number = 0
): Promise<{
  queries: AIQuery[];
  total: number;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { queries: [], total: 0 };
  }

  const { data: queries, error, count } = await supabase
    .from('ai_queries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user AI queries:', error);
    throw new Error('Failed to fetch AI queries');
  }

  return {
    queries: queries as AIQuery[],
    total: count || 0
  };
}

/**
 * Delete an AI query
 */
export async function deleteAIQuery(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_queries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting AI query:', error);
    throw new Error('Failed to delete AI query');
  }
}

/**
 * Get AI query statistics for a user
 */
export async function getAIQueryStats(): Promise<{
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageProcessingTime: number;
  totalTokensUsed: number;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageProcessingTime: 0,
      totalTokensUsed: 0
    };
  }

  const { data: stats, error } = await supabase
    .from('ai_queries')
    .select('status, processing_time_ms, token_count')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching AI query stats:', error);
    throw new Error('Failed to fetch AI query statistics');
  }

  const totalQueries = stats.length;
  const successfulQueries = stats.filter(q => q.status === 'completed').length;
  const failedQueries = stats.filter(q => q.status === 'failed').length;

  const completedQueries = stats.filter(q => q.status === 'completed' && q.processing_time_ms);
  const averageProcessingTime = completedQueries.length > 0
    ? completedQueries.reduce((sum, q) => sum + q.processing_time_ms, 0) / completedQueries.length
    : 0;

  const totalTokensUsed = stats
    .filter(q => q.token_count)
    .reduce((sum, q) => sum + q.token_count, 0);

  return {
    totalQueries,
    successfulQueries,
    failedQueries,
    averageProcessingTime,
    totalTokensUsed
  };
}
