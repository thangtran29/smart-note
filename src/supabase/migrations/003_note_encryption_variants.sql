-- Note encryption variants table
CREATE TABLE public.note_encryption_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  encrypted_content TEXT NOT NULL,
  salt BYTEA NOT NULL CHECK (length(salt) = 16),
  iv BYTEA NOT NULL CHECK (length(iv) = 12),
  kdf_type TEXT DEFAULT 'pbkdf2' NOT NULL,
  kdf_iterations INTEGER NOT NULL CHECK (kdf_iterations >= 300000 AND kdf_iterations <= 500000),
  kdf_hash TEXT DEFAULT 'SHA-256' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.note_encryption_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own note variants"
  ON public.note_encryption_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_encryption_variants.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own note variants"
  ON public.note_encryption_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_encryption_variants.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own note variants"
  ON public.note_encryption_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_encryption_variants.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note variants"
  ON public.note_encryption_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_encryption_variants.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_note_encryption_variants_note_id ON public.note_encryption_variants(note_id);
CREATE INDEX idx_note_encryption_variants_created_at ON public.note_encryption_variants(created_at DESC);

-- Constraint: Maximum 10 variants per note
CREATE OR REPLACE FUNCTION check_variant_limit()
RETURNS TRIGGER AS $$
DECLARE
  variant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO variant_count
  FROM public.note_encryption_variants
  WHERE note_id = NEW.note_id;
  
  IF variant_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 encryption variants allowed per note';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_variant_limit
  BEFORE INSERT ON public.note_encryption_variants
  FOR EACH ROW EXECUTE FUNCTION check_variant_limit();

-- Note: We're sending hex strings with \x prefix directly
-- PostgreSQL natively understands this format for BYTEA columns
-- No trigger needed - PostgreSQL handles \x hex format automatically

