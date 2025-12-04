// Tag entity
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// For creating a new tag
export interface CreateTagInput {
  name: string;
  color?: string;
}

// For updating an existing tag
export interface UpdateTagInput {
  name?: string;
  color?: string;
}

// Tag with usage count
export interface TagWithCount extends Tag {
  note_count: number;
}

// Note with tags included
export interface NoteWithTags {
  id: string;
  user_id: string;
  title: string;
  content: unknown; // EditorJSContent | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

// For filtering notes by tags
export interface TagFilter {
  tagIds?: string[];  // AND logic - note must have ALL these tags
  limit?: number;
  offset?: number;
}

export interface CreateTagResult {
  success: boolean;
  tag?: Tag;
  error?: string;
}

export interface UpdateTagResult {
  success: boolean;
  tag?: Tag;
  error?: string;
}

export interface DeleteTagResult {
  success: boolean;
  error?: string;
}

export interface AssignTagsResult {
  success: boolean;
  error?: string;
}

export interface RemoveTagResult {
  success: boolean;
  error?: string;
}

// Supabase query result types
export interface TagWithNoteTags {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  note_tags: unknown[]; // Array of note_tags records
}

export interface NoteWithNoteTags {
  id: string;
  user_id: string;
  title: string;
  content: unknown;
  created_at: string;
  updated_at: string;
  note_tags: Array<{
    tags: Tag | null;
  } | null>;
}
