# Feature: Tags System

## Overview
User-defined tags for categorizing notes with color coding and filtering capabilities.

## Tech Stack
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- Create new tags with name and color
- Assign multiple tags to a note
- Remove tags from a note
- Delete unused tags
- Filter notes by single tag
- Filter notes by multiple tags (AND/OR)
- Display tags on note cards

### Non-Functional
- Many-to-many relationship (notes ↔ tags)
- RLS: Users can only access their own tags
- Unique tag names per user

## Database

### tags table
```sql
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT
);
```

### note_tags junction table
```sql
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
```

## User Stories
1. As a user, I can create a new tag with a color
2. As a user, I can assign tags to a note
3. As a user, I can remove tags from a note
4. As a user, I can filter notes by selecting tags
5. As a user, I can see all my tags in a sidebar
6. As a user, I can delete a tag I no longer need

## Components
- `<TagSelector />` - Multi-select for assigning tags
- `<TagBadge />` - Colored tag display
- `<TagFilter />` - Sidebar filter component
- `<TagManager />` - Create/edit/delete tags

## Acceptance Criteria
- [ ] Create tag with name and color
- [ ] Assign tag to note creates junction record
- [ ] Remove tag deletes junction record
- [ ] Filter by tag shows only matching notes
- [ ] Multiple tag filter works (AND logic)
- [ ] Delete tag cascades to junction table
- [ ] Tags display with correct colors
