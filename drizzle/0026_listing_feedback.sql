-- 0026_listing_feedback.sql
-- Table, indexes, and RLS for listing feedback (public Q&A thread).

BEGIN;

CREATE TABLE IF NOT EXISTS public.listing_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.listing_feedback(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_feedback_listing ON public.listing_feedback(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_feedback_parent ON public.listing_feedback(parent_id);
CREATE INDEX IF NOT EXISTS idx_listing_feedback_created ON public.listing_feedback(created_at ASC);

-- Enable RLS
ALTER TABLE public.listing_feedback ENABLE ROW LEVEL SECURITY;

-- Select: anyone can read listing feedback (public)
CREATE POLICY listing_feedback_select ON public.listing_feedback
  FOR SELECT USING (true);

-- Insert: authenticated users can insert feedback for themselves
CREATE POLICY listing_feedback_insert ON public.listing_feedback
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

-- Delete: user can delete their own feedback
CREATE POLICY listing_feedback_delete ON public.listing_feedback
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Add to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_feedback;

COMMIT;
