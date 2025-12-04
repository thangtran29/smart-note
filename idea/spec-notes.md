# Feature: Note Management

## Overview
CRUD operations for notes with Editor.js rich text editing, storing content as JSON.

## Tech Stack
- **Editor:** Editor.js
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- Create new note with title and content
- Read/view note with formatted content
- Update note title and content
- Delete note with confirmation
- Auto-save while editing
- Display note list with timestamps

### Non-Functional
- Content stored as JSONB (Editor.js format)
- Automatic created_at/updated_at timestamps
- RLS: Users can only access their own notes

## Database

### notes table
```sql
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT,
  content JSONB, -- Editor.js output
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## User Stories
1. As a user, I can create a new note
2. As a user, I can view my notes in a list
3. As a user, I can edit a note's title and content
4. As a user, I can delete a note
5. As a user, I can see when a note was last modified

## Editor.js Blocks
- Paragraph
- Header (H1, H2, H3)
- List (ordered, unordered)
- Code block
- Quote

## Pages/Components
- `/notes` - Note list view
- `/notes/new` - Create new note
- `/notes/[id]` - View/edit note
- `<NoteEditor />` - Editor.js wrapper component
- `<NoteCard />` - Note preview in list

## Acceptance Criteria
- [ ] Create note saves to database
- [ ] Editor.js renders with configured blocks
- [ ] Content saves as valid JSON
- [ ] Update triggers updated_at timestamp
- [ ] Delete removes note from database
- [ ] Note list shows title, preview, timestamps
