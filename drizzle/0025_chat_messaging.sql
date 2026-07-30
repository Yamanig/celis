-- 0025_chat_messaging.sql
-- Tables, indexes, RLS, and RPCs for buyer/seller chat.

BEGIN;

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listings(id),
  buyer_id        uuid NOT NULL REFERENCES auth.users(id),
  seller_id       uuid NOT NULL REFERENCES auth.users(id),
  last_message    text,
  last_message_at timestamptz,
  buyer_read_at   timestamptz,
  seller_read_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id, seller_id),
  CONSTRAINT conversations_no_self CHECK (buyer_id <> seller_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  body            text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

-- ----------------------------------------------------------------
-- RLS: Enable
-- ----------------------------------------------------------------

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: participants can read their own
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Conversations: participants cannot directly insert/update/delete
-- (uses RPCs below)

-- Messages: participants can read messages in their conversations
CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Messages: participants can insert (sender_id forced by RPC)
CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );

-- ----------------------------------------------------------------
-- RPC: start_or_get_conversation
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_or_get_conversation(
  p_listing_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_buyer_id  uuid;
  v_seller_id uuid;
  v_conv_id   uuid;
  v_result    jsonb;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT seller_id INTO v_seller_id
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = '02000';
  END IF;

  IF v_buyer_id = v_seller_id THEN
    RAISE EXCEPTION 'Cannot chat with yourself' USING ERRCODE = '23000';
  END IF;

  INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
  VALUES (p_listing_id, v_buyer_id, v_seller_id)
  ON CONFLICT (listing_id, buyer_id, seller_id) DO NOTHING;

  SELECT c.id INTO v_conv_id
  FROM public.conversations c
  WHERE c.listing_id = p_listing_id
    AND c.buyer_id = v_buyer_id
    AND c.seller_id = v_seller_id;

  SELECT jsonb_build_object(
    'id', c.id,
    'listing_id', c.listing_id,
    'buyer_id', c.buyer_id,
    'seller_id', c.seller_id,
    'last_message', c.last_message,
    'last_message_at', c.last_message_at,
    'buyer_read_at', c.buyer_read_at,
    'seller_read_at', c.seller_read_at,
    'created_at', c.created_at
  ) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conv_id;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: send_message
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_body           text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id      uuid;
  v_is_buyer     boolean;
  v_is_seller    boolean;
  v_trimmed      text;
  v_msg_id       uuid;
  v_result       jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT (c.buyer_id = v_user_id), (c.seller_id = v_user_id)
  INTO v_is_buyer, v_is_seller
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF NOT (v_is_buyer OR v_is_seller) THEN
    RAISE EXCEPTION 'Not a participant in this conversation' USING ERRCODE = '28000';
  END IF;

  v_trimmed := trim(p_body);
  IF length(v_trimmed) = 0 OR length(v_trimmed) > 2000 THEN
    RAISE EXCEPTION 'Message must be 1-2000 characters' USING ERRCODE = '22000';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_user_id, v_trimmed)
  RETURNING id INTO v_msg_id;

  UPDATE public.conversations
  SET
    last_message = v_trimmed,
    last_message_at = now(),
    updated_at = now(),
    buyer_read_at = CASE WHEN v_is_buyer THEN now() ELSE buyer_read_at END,
    seller_read_at = CASE WHEN v_is_seller THEN now() ELSE seller_read_at END
  WHERE id = p_conversation_id;

  SELECT jsonb_build_object(
    'id', m.id,
    'conversation_id', m.conversation_id,
    'sender_id', m.sender_id,
    'body', m.body,
    'created_at', m.created_at
  ) INTO v_result
  FROM public.messages m
  WHERE m.id = v_msg_id;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: mark_conversation_read
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id   uuid;
  v_is_buyer  boolean;
  v_is_seller boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT (c.buyer_id = v_user_id), (c.seller_id = v_user_id)
  INTO v_is_buyer, v_is_seller
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF NOT (v_is_buyer OR v_is_seller) THEN
    RAISE EXCEPTION 'Not a participant in this conversation' USING ERRCODE = '28000';
  END IF;

  UPDATE public.conversations
  SET
    buyer_read_at = CASE WHEN v_is_buyer THEN now() ELSE buyer_read_at END,
    seller_read_at = CASE WHEN v_is_seller THEN now() ELSE seller_read_at END
  WHERE id = p_conversation_id;
END;
$$;

-- ----------------------------------------------------------------
-- Realtime: enable for messages
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

COMMIT;
