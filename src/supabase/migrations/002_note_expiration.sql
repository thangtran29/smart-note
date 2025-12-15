-- Migration: Add expiration date to notes
-- Created: December 2025
-- Feature: Note expiration

-- Add expires_at column to notes table
ALTER TABLE notes
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for efficient querying of expired notes
CREATE INDEX idx_notes_expires_at ON notes(expires_at) WHERE expires_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN notes.expires_at IS 'Timestamp when the note expires. NULL means the note never expires.';

