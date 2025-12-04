# Feature: Search & Date Filtering

## Overview
Real-time search through note content and titles, plus date range filtering.

## Tech Stack
- **Database:** Supabase (PostgreSQL full-text search)
- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- Search by note title
- Search by note content (full-text)
- Filter by date range presets (today, last 7 days, last 30 days)
- Filter by custom date range
- Combine search with tag filters
- Real-time search results (debounced)
- Clear all filters

### Non-Functional
- Debounced search input (300ms)
- PostgreSQL full-text search for content
- Efficient query with indexes

## Search Implementation

### Full-text search on JSONB content
```sql
-- Extract text from Editor.js JSON for search
CREATE OR REPLACE FUNCTION extract_note_text(content JSONB)
RETURNS TEXT AS $$
  SELECT string_agg(block->>'text', ' ')
  FROM jsonb_array_elements(content->'blocks') AS block;
$$ LANGUAGE SQL IMMUTABLE;
```

## User Stories
1. As a user, I can search notes by title
2. As a user, I can search notes by content
3. As a user, I can filter notes created today
4. As a user, I can filter notes from the last week
5. As a user, I can set a custom date range
6. As a user, I can combine search with tag filters
7. As a user, I can clear all filters at once

## Date Presets
- Today
- Last 7 days
- Last 30 days
- This month
- Custom range (date picker)

## Components
- `<SearchInput />` - Debounced search field
- `<DateFilter />` - Date range selector
- `<FilterBar />` - Combined filter controls
- `<ActiveFilters />` - Display active filters with clear option

## Acceptance Criteria
- [ ] Title search returns matching notes
- [ ] Content search finds text within Editor.js blocks
- [ ] Date presets filter correctly
- [ ] Custom date range works
- [ ] Search + tag filter combines correctly
- [ ] Results update in real-time (debounced)
- [ ] Clear filters resets all
