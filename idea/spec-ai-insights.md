# Feature: AI Insights View

## Overview
Advanced view for querying AI across multiple filtered notes, enabling cross-note analysis and synthesis.

## Tech Stack
- **AI Provider:** OpenAI (GPT-4)
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js (App Router, Server Actions)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- Dedicated "AI Insights" page/view
- Apply filters (tags, date range) to select notes
- Preview filtered note collection
- Send query to AI with all filtered notes as context
- Display AI analysis response
- Save insight queries and responses (optional)

### Non-Functional
- Handle token limits (truncate or summarize if too many notes)
- Server-side API calls only
- Loading state for long queries

## AI Context Template
```
You are analyzing multiple notes. Here are the notes:

Note 1: {title}
{content}

Note 2: {title}
{content}

... (up to N notes)

User query: {user_query}
```

## Example Queries
- "What are the common themes across these notes?"
- "Summarize the key decisions from these meeting notes"
- "What are the top 5 action items from all these notes?"
- "Identify any contradictions or conflicts"
- "What patterns do you see in my brainstorming notes?"

## User Stories
1. As a user, I can access an AI Insights view
2. As a user, I can filter notes by tags and date
3. As a user, I can see which notes are included in my query
4. As a user, I can ask the AI to analyze all filtered notes
5. As a user, I can see the AI's cross-note analysis

## Token Management
- Count tokens before sending
- If over limit: summarize each note first, or limit note count
- Display warning if notes truncated

## Pages/Components
- `/insights` - AI Insights view
- `<InsightsFilter />` - Tag + date filter for note selection
- `<NotePreviewList />` - Show selected notes before query
- `<InsightsQuery />` - Input for cross-note question
- `<InsightsResponse />` - Display AI analysis

## API Routes
- `POST /api/ai/insights` - Send multi-note query

## Acceptance Criteria
- [ ] Insights page accessible from navigation
- [ ] Filters select correct notes
- [ ] Selected notes displayed before query
- [ ] AI receives all note contents as context
- [ ] AI response displayed clearly
- [ ] Token limit handled gracefully
- [ ] Loading state shown during query
