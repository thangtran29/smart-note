<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0 (Initial constitution)
Modified principles: N/A (new)
Added sections: Core Principles (5), Technology Stack, Security & Data, Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ⚠ pending review
  - .specify/templates/spec-template.md: ⚠ pending review
  - .specify/templates/tasks-template.md: ⚠ pending review
Follow-up TODOs: None
-->

# Smart Notes Constitution

## Core Principles

### I. Simplicity First (KISS)
All implementations MUST prioritize straightforward, minimal code. Over-engineering is prohibited.
- Prefer built-in framework features over custom solutions
- Avoid premature abstractions; extract only when patterns repeat 3+ times
- Each component/function MUST have a single, well-defined purpose (SRP)

### II. Type Safety (NON-NEGOTIABLE)
Strict TypeScript enforcement across the entire codebase.
- No `any` type allowed; use `unknown` with type guards when type is uncertain
- All function parameters and return types MUST be explicitly typed
- Editor.js content stored as typed JSONB structures

### III. Security by Default
All data access MUST be secured through Supabase Row-Level Security (RLS).
- API keys MUST be server-side only (Next.js API routes/Server Actions)
- User data isolation enforced at database level
- Authentication state validated server-side before data operations

### IV. Component-Driven UI
UI development follows shadcn/ui patterns with Tailwind CSS.
- Reusable components live in `src/components/`
- Page-specific components co-located with their routes
- Consistent styling via Tailwind utility classes; no inline styles

### V. Feature Modularity
Each feature MUST be self-contained and independently testable.
- Clear boundaries between: Auth, Notes, Tags, Search, AI Chat, AI Insights
- Shared utilities in `src/lib/`; feature logic in `src/features/` or route handlers
- Database operations abstracted through typed service functions

## Technology Stack

The following stack is mandatory and MUST NOT be changed without constitution amendment:

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Icons | Lucide React | latest |
| Database | Supabase (PostgreSQL) | latest |
| Auth | Supabase Auth | latest |
| Editor | Editor.js | 2.x |
| AI | OpenAI API | latest |

## Security & Data

- All database tables MUST have RLS policies enabled
- User-owned data tables MUST include `user_id` foreign key to `profiles`
- Passwords handled exclusively by Supabase Auth; never stored in application
- Environment variables for secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
- `OPENAI_API_KEY` MUST NOT have `NEXT_PUBLIC_` prefix

## Governance

This constitution supersedes all other development practices for the Smart Notes project.

**Amendment Process:**
1. Propose change with rationale
2. Document impact on existing code
3. Update constitution version (MAJOR.MINOR.PATCH)
4. Update dependent templates if affected

**Compliance:**
- All code changes MUST comply with these principles
- Deviations require explicit justification and constitution amendment
- Runtime guidance available in `.specify/` directory

**Version**: 1.0.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
