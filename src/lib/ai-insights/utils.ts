import { encode } from 'gpt-3-encoder';
import type { EditorJSContent } from '@/lib/notes/types';
import type { NoteSearchResult } from '@/lib/search/types';
import type { SimplifiedNote } from './types';

/**
 * Count tokens in a text string using GPT-3 encoder
 */
export function countTokens(text: string): number {
  try {
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    console.warn('Token counting failed, using fallback estimation:', error);
    // Fallback: rough estimation of 4 characters per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Extract text content from Editor.js content
 */
export function extractNoteText(content: EditorJSContent | null): string {
  if (!content?.blocks?.length) return '';

  return content.blocks
    .filter(block => block.type === 'paragraph' || block.type === 'header')
    .map(block => (block.data?.text as string) || '')
    .filter(text => text.trim().length > 0)
    .join(' ')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim();
}

/**
 * Calculate token usage for a collection of notes
 */
export function calculateTokenUsage(
  notes: NoteSearchResult[],
  query: string,
  promptTemplate: string
): {
  totalTokens: number;
  breakdown: {
    prompt: number;
    query: number;
    notes: number;
    context: number;
  };
} {
  const queryTokens = countTokens(query);
  const promptTokens = countTokens(promptTemplate);

  // Calculate notes content tokens
  let notesTokens = 0;
  for (const note of notes) {
    const noteText = extractNoteText(note.content);
    const formattedNote = `Note: ${note.title}\n${noteText}`;
    notesTokens += countTokens(formattedNote);
  }

  const contextTokens = promptTokens + queryTokens + notesTokens;
  const totalTokens = contextTokens + 1000; // Add buffer for response

  return {
    totalTokens,
    breakdown: {
      prompt: promptTokens,
      query: queryTokens,
      notes: notesTokens,
      context: contextTokens
    }
  };
}

/**
 * Truncate notes to fit within token limit
 */
export function truncateNotesForTokenLimit(
  notes: SimplifiedNote[],
  maxTokens: number = 6000
): {
  notes: SimplifiedNote[];
  truncated: boolean;
  tokenCount: number;
  removedCount: number;
} {
  if (notes.length === 0) {
    return { notes: [], truncated: false, tokenCount: 0, removedCount: 0 };
  }

  // Sort notes by content length (shorter first to keep more notes)
  const sortedNotes = [...notes].sort((a, b) => a.content.length - b.content.length);

  let selectedNotes: SimplifiedNote[] = [];
  let totalTokens = 0;
  let truncated = false;

  for (const note of sortedNotes) {
    const formattedNote = `Note: ${note.title}\n${note.content}`;
    const noteTokens = countTokens(formattedNote);

    if (totalTokens + noteTokens <= maxTokens) {
      selectedNotes.push(note);
      totalTokens += noteTokens;
    } else {
      truncated = true;
      break;
    }
  }

  // If we truncated, try to keep the most recent notes instead
  if (truncated && selectedNotes.length < Math.min(5, notes.length)) {
    // Sort by creation date (newest first) and take top N
    const recentNotes = [...notes]
      .filter(note => note.created_at) // Only notes with dates
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, Math.min(5, notes.length));

    selectedNotes = recentNotes;
    totalTokens = recentNotes.reduce((sum, note) => {
      const formattedNote = `Note: ${note.title}\n${note.content}`;
      return sum + countTokens(formattedNote);
    }, 0);
  }

  return {
    notes: selectedNotes,
    truncated,
    tokenCount: totalTokens,
    removedCount: notes.length - selectedNotes.length
  };
}

/**
 * Format notes for AI context
 */
export function formatNotesForAI(notes: SimplifiedNote[]): string {
  return notes.map((note, index) => {
    return `Note ${index + 1}: ${note.title}\n${note.content}`;
  }).join('\n\n');
}

/**
 * Validate token limits for AI models
 */
export function getTokenLimits(model: 'gpt-4' | 'gpt-3.5-turbo'): {
  maxTokens: number;
  recommendedMax: number;
} {
  switch (model) {
    case 'gpt-4':
      return { maxTokens: 8192, recommendedMax: 6000 };
    case 'gpt-3.5-turbo':
      return { maxTokens: 4096, recommendedMax: 3000 };
    default:
      return { maxTokens: 4096, recommendedMax: 3000 };
  }
}
