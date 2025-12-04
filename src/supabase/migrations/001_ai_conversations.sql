-- Migration: Create ai_conversations table
-- Created: December 1, 2025
-- Feature: 005-ai-note-chat

-- Create ai_conversations table
CREATE TABLE ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL CHECK (length(trim(user_message)) > 0),
  ai_response TEXT NOT NULL CHECK (length(trim(ai_response)) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_ai_conversations_note_id_created_at
  ON ai_conversations(note_id, created_at DESC);

CREATE INDEX idx_ai_conversations_user_id
  ON ai_conversations(user_id);

-- Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);
