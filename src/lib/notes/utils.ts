import type { EditorJSContent } from './types';

/**
 * Extract a text preview from Editor.js content
 * Returns the first paragraph or header text, truncated to maxLength
 */
export function getPreview(content: EditorJSContent | null, maxLength = 100): string {
  if (!content?.blocks?.length) {
    return 'No content';
  }

  // Find first text-containing block
  const textBlock = content.blocks.find(
    (block) => block.type === 'paragraph' || block.type === 'header'
  );

  if (!textBlock) {
    return 'No content';
  }

  const text = (textBlock.data?.text as string) || '';
  
  // Strip HTML tags if any
  const plainText = text.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trim() + '...';
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString();
}

/**
 * Get display title for a note (fallback to empty string if blank)
 */
export function getDisplayTitle(title: string | null | undefined): string {
  return title?.trim() || 'Untitled';
}

/**
 * Extract searchable text from Editor.js content
 * Returns concatenated text from all text blocks
 */
export function extractNoteText(content: EditorJSContent | null): string {
  if (!content?.blocks?.length) {
    return '';
  }

  return content.blocks
    .filter(block => block.type === 'paragraph' || block.type === 'header')
    .map(block => (block.data?.text as string) || '')
    .filter(text => text.trim().length > 0)
    .join(' ')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim();
}
