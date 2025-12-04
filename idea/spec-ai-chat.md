# Feature: AI Chat Panel

## Overview
Per-note AI discussion panel where users can have contextual conversations with AI about their note content.

## Tech Stack
- **AI Provider:** OpenAI (GPT-4)
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js (App Router, Server Actions)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- Open AI chat panel for any note
- AI receives note content as context
- Send messages to AI
- Receive AI responses
- Persistent conversation history per note
- View previous conversations
- Clear conversation history

### Non-Functional
- API key secured in server-side only
- Streaming responses (optional)
- Rate limiting consideration
- RLS: Users can only access their own conversations

## Database

### ai_conversations table
```sql
CREATE TABLE ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## AI Context Template
```
You are analyzing a note. Here is the note content:

Title: {note.title}
Content: {extracted_text_from_editor_js}

User question: {user_message}
```

## Example Queries
- "Summarize the key points of this note"
- "Generate action items from this meeting note"
- "Explain the concept in the second paragraph"
- "Brainstorm ideas based on this"
- "What questions should I consider?"

## User Stories
1. As a user, I can open an AI chat panel for a note
2. As a user, I can ask the AI questions about my note
3. As a user, I can see the AI's response
4. As a user, I can view my conversation history
5. As a user, I can continue a previous conversation
6. As a user, I can clear the conversation history

## Components
- `<AIChatPanel />` - Slide-out or modal chat interface
- `<ChatMessage />` - User/AI message bubble
- `<ChatInput />` - Message input with send button
- `<ChatHistory />` - List of previous messages

## API Routes
- `POST /api/ai/chat` - Send message, receive AI response

## Acceptance Criteria
- [ ] Chat panel opens for selected note
- [ ] AI receives note content as context
- [ ] User message sent to OpenAI API
- [ ] AI response displayed in chat
- [ ] Conversation saved to database
- [ ] History loads on panel open
- [ ] Clear history deletes records
