# Feature: Daily AI Token Limits per User

## Overview
Enforce a daily token budget for each user across AI-powered features (chat, insights, etc.). Requests exceeding the daily budget are rejected server-side; clients only display status.

## Goals
- Limit total AI tokens per user per UTC day.
- Prevent overuse/abuse via server-side enforcement.
- Provide clear user feedback (remaining, warnings, exhausted).

## Non-Goals (for now)
- Per-workspace/team quotas.
- Billing/monetization hooks.
- Model-specific pricing weights (can extend later).

## Scope / Coverage
- Endpoints: `/api/ai/chat`, `/api/ai/insights` (extendable).
- Counts both prompt/context and completion tokens.
- Resets at UTC midnight.

## Data Model
- Table: `ai_token_usage`
  - `user_id UUID` (PK part, FK profiles)
  - `date DATE` (UTC, PK part)
  - `tokens_used BIGINT NOT NULL DEFAULT 0`
  - `last_updated_at TIMESTAMPTZ DEFAULT NOW()`
  - Unique constraint on (`user_id`, `date`)
- RLS: owner-only (select/insert/update where `auth.uid() = user_id`).

## Server Enforcement
- Helper `withTokenBudget(userId, limit, estimateFn, executeFn)`:
  1) Fetch row for today; insert if missing.
  2) Estimate tokens (prompt + context + user input). If `estimate + used > limit` → reject.
  3) Run model call; capture actual tokens from provider response; fallback to estimate if unavailable.
  4) Upsert `tokens_used = tokens_used + actual`.
  5) Return remaining tokens.
- Concurrency: use a transaction with `SELECT ... FOR UPDATE` (or accept minor overage if simplified).
- Failure handling: if model call fails before tokens returned, do not charge; if provider returns usage despite failure, charge usage.

## Token Counting
- Reuse insights `countTokens`; add chat-aware estimator:
  - Includes system prompt, note context, user message, recent history sent, and expected completion allowance.
  - Use model-aware encodings (tiktoken).

## API Changes
- Chat (`/api/ai/chat`) and Insights: wrap execution with `withTokenBudget`.
- Respond with:
  - `remainingTokens`
  - `limit`
  - `usageThisRequest`
  - Error shape on exceed: `{ success: false, error: 'Daily AI token limit reached', remaining: 0, limit }`

## UX
- Show remaining tokens (e.g., “2,500 / 5,000 tokens left today”).
- Warning at <20% remaining.
- Disable/guard send when exhausted; display friendly message suggesting retry next day.

## Config
- Env: `AI_DAILY_TOKEN_LIMIT` (default e.g., 5000). Later: per-model weights or per-plan overrides.

## Edge Cases
- Parallel requests: small overage unless locking; prefer transaction for accuracy.
- Date rollover: keyed by UTC `date`, no cron needed.
- Model differences: future: multiplier per model; current: single pool.
- Deletions: clearing history does not refund tokens (simpler).

## Metrics / Logging
- Log rejections and usage deltas.
- Optional: per-endpoint usage breakdown for tuning limits.

## Test Scenarios
- Below limit: passes, updates usage.
- Exactly at limit: next request rejected.
- Parallel sends: no double-charge (with lock) or acceptable small overage.
- Rollover at UTC midnight resets automatically.

