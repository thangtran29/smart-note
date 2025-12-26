// Editor.js block structure
export interface EditorJSBlock {
  id: string;
  type: 'paragraph' | 'header' | 'list' | 'code' | 'quote';
  data: Record<string, unknown>;
}

// Editor.js output structure
export interface EditorJSContent {
  time: number;
  blocks: EditorJSBlock[];
  version: string;
}

// NoteEditor ref interface - moved here to avoid SSR issues
export interface NoteEditorRef {
  appendText: (text: string) => Promise<void>;
}

// Note entity
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: EditorJSContent | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  // Encryption metadata (computed, not stored in notes table)
  is_protected?: boolean;  // True if note has encryption variants
  variant_count?: number;  // Number of encryption variants (for UI, not security-sensitive)
}

// For creating a new note
export interface CreateNoteInput {
  title?: string;
  content?: EditorJSContent;
  expires_at?: Date | string | null;
}

// For updating an existing note
export interface UpdateNoteInput {
  title?: string;
  content?: EditorJSContent;
  expires_at?: Date | string | null;
}

// Note with computed preview for list display
export interface NoteListItem {
  id: string;
  title: string;
  preview: string;
  updated_at: string;
}

// Action result types
export type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string };
