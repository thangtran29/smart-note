import type { EditorJSContent } from '@/lib/notes/types';

export function extractNoteText(content: EditorJSContent | null): string {
  if (!content || !content.blocks) return '';

  return content.blocks
    .map(block => {
      switch (block.type) {
        case 'paragraph':
        case 'header':
          return block.data?.text || '';
        case 'list':
          return Array.isArray(block.data?.items) ? block.data.items.join(' ') : '';
        case 'quote':
          return block.data?.text || '';
        default:
          return '';
      }
    })
    .filter((text): text is string => typeof text === 'string' && text.trim() !== '')
    .join('\n\n');
}

export function formatAIContext(noteTitle: string, noteContent: string): string {
  return `You are analyzing a note. Here is the note content:

Title: ${noteTitle}
Content: ${noteContent}

IMPORTANT: Respond in the SAME LANGUAGE as the user's query and note content. If the user asks in Vietnamese, respond in Vietnamese. If they ask in English, respond in English. Maintain the same language throughout the conversation.

Please provide helpful, contextual responses about this note.`;
}
