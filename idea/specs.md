# Smart Notes App - Technical Specifications

## Overview

A modern, minimalist web application for quickly capturing and managing notes, enhanced with integrated AI capabilities. Users can have contextual conversations with AI about their content, enabling deeper analysis, brainstorming, and organization.

---

## Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Text Editor:** Editor.js

### Backend
- **Runtime:** Next.js API Routes / Server Actions
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Subscriptions (optional)

### AI Integration
- **Provider:** OpenAI
- **Model:** GPT-4

### Deployment
- **Hosting:** Vercel
- **Database Hosting:** Supabase

---

## Core Features

### A. Note Management
- **Rich Note Editor:** Editor.js block-style editing (text, lists, code blocks)
- **Note Metadata:**
  - Automatic timestamps (created_at, updated_at)
  - Content stored as JSON (Editor.js format)
  - User-defined tags for categorization
- **Note List & Filtering:**
  - Filter by date range (today, last week, custom)
  - Filter by tags (single or multiple)
  - Real-time search through content and titles

### B. Integrated AI Interaction
- **AI Chat Panel:** Per-note contextual AI discussion
  - AI pre-informed of note content
  - Example queries: summarize, generate action items, explain concepts, brainstorm
- **Persistent Conversations:** AI responses saved as searchable discussion history

### C. Advanced AI Query View
- **AI Insights View:** Define complex filters (date + tags)
- **Multi-note Analysis:** Query AI across filtered note collections
  - Example: "What are common themes across these notes?"

---

## Database Schema

### Tables
1. **profiles** - User profiles (extends Supabase auth.users)
2. **notes** - Note content with Editor.js JSON
3. **tags** - User-defined tags with colors
4. **note_tags** - Many-to-many junction table
5. **ai_conversations** - Persistent AI chat history per note

### Row-Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data

---

## User Workflow

1. **Auth:** Sign up / login via Supabase Auth
2. **Create:** Capture notes with Editor.js, add tags
3. **Organize:** Filter notes by tags in sidebar
4. **Analyze:** Open AI Chat Panel, ask contextual questions
5. **Synthesize:** Use AI Insights view for multi-note analysis

---

## Security & Performance

- **RLS:** Row-level security on all tables
- **Server-side AI calls:** API keys protected via Next.js API routes
- **Efficient queries:** PostgreSQL full-text search

---

## Must Have
- [x] User authentication (signup, login, logout)
- [x] CRUD operations for notes
- [x] Editor.js integration for rich text editing
- [x] Tag system with filtering
- [x] Per-note AI chat panel
- [x] Persistent AI conversation history

## Nice to Have
- [ ] Real-time sync across devices
- [ ] Dark mode toggle
- [ ] Export notes (Markdown, PDF)
- [ ] Keyboard shortcuts
- [ ] AI Insights view (multi-note analysis)

## Constraints
- [ ] OpenAI API key required for AI features
- [ ] Supabase project required for backend
- [ ] Node.js 18+ required
