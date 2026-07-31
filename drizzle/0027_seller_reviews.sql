-- 0027_seller_reviews.sql
-- Table, indexes, and RLS for seller ratings and reviews.

BEGIN;

CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text CHECK (length(trim(comment)) BETWEEN 1 AND 1000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_reviewer_seller UNIQUE (seller_id, reviewer_id),
  CONSTRAINT no_self_review CHECK (reviewer_id <> seller_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON public.seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_reviewer ON public.seller_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_created ON public.seller_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- Select: anyone can read reviews
CREATE POLICY seller_reviews_select ON public.seller_reviews
  FOR SELECT USING (true);

-- Insert: authenticated users can insert reviews, reviewer_id must match auth.uid(), and no self reviews
CREATE POLICY seller_reviews_insert ON public.seller_reviews
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = reviewer_id AND reviewer_id <> seller_id
  );

-- Update: reviewers can update their own reviews
CREATE POLICY seller_reviews_update ON public.seller_reviews
  FOR UPDATE USING (
    auth.uid() = reviewer_id
  );

-- Delete: reviewers can delete their own reviews
CREATE POLICY seller_reviews_delete ON public.seller_reviews
  FOR DELETE USING (
    auth.uid() = reviewer_id
  );

-- Add to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_reviews;

COMMIT;
