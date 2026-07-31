-- Migration: Add fcm_token column to profiles table for push notification support
-- This mirrors the fcm_token pattern used in the kulan.io backend

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fcm_token TEXT DEFAULT NULL;

-- Index for fast lookups when the backend needs to send pushes by user ID
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles (fcm_token)
  WHERE fcm_token IS NOT NULL;

-- RLS: users can only update their own fcm_token (already covered by existing profiles RLS)
-- No additional policies needed.
