-- 0028_notification_jobs.sql
-- Job queue for push notifications triggered by database events.
-- Workers poll this table to send FCM pushes via Firebase Admin SDK.

BEGIN;

-- ----------------------------------------------------------------
-- notification_jobs table
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz
);

-- Worker picks up oldest pending jobs first
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status
  ON public.notification_jobs (status, created_at)
  WHERE status = 'pending';

-- RLS: only the service-role worker accesses this table
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Helper: get the other participant ID in a conversation
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_other_participant(
  p_conversation_id uuid,
  p_sender_id       uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_buyer_id  uuid;
  v_seller_id uuid;
BEGIN
  SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
  FROM public.conversations
  WHERE id = p_conversation_id;

  IF v_buyer_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_buyer_id = p_sender_id THEN
    RETURN v_seller_id;
  END IF;

  RETURN v_buyer_id;
END;
$$;

-- ----------------------------------------------------------------
-- Trigger: enqueue notification job on chat message INSERT
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enqueue_chat_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_receiver_id uuid;
  v_listing_id  uuid;
BEGIN
  -- Find the other participant
  v_receiver_id := public.get_other_participant(NEW.conversation_id, NEW.sender_id);
  IF v_receiver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get listing_id for deep-link data
  SELECT listing_id INTO v_listing_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- Enqueue the notification job (the worker reads profiles.fcm_token at send time, not here)
  INSERT INTO public.notification_jobs (user_id, payload)
  VALUES (
    v_receiver_id,
    jsonb_build_object(
      'type', 'chat_message',
      'conversation_id', NEW.conversation_id,
      'listing_id', v_listing_id,
      'title', COALESCE(
        (SELECT profiles.display_name FROM public.profiles WHERE profiles.id = NEW.sender_id),
        'New message'
      ),
      'body', left(NEW.body, 200)
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_chat_notification ON public.messages;
CREATE TRIGGER trg_enqueue_chat_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_chat_notification();

COMMIT;
