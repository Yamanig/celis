-- ============================================================
-- 0024: Map dynamic condition and delivery values before writing enum columns
-- ============================================================
--
-- Dynamic category conditions use values like used_good / used_fair for
-- field validation, while listings.condition is the legacy item_condition enum.
-- Mobile also uses delivery as a UI value, while listings.delivery_method is
-- the delivery_method enum (shipping/local_pickup/both).
-- Keep p_condition unchanged for validate_listing_fields(), but map it before
-- writing listings.condition so mobile/web listing creation does not fail with:
-- "column condition is of type item_condition but expression is of type text".

CREATE OR REPLACE FUNCTION normalize_listing_condition(p_condition text)
RETURNS item_condition
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_condition
    WHEN 'new_with_tags' THEN 'new_with_tags'::item_condition
    WHEN 'like_new' THEN 'like_new'::item_condition
    WHEN 'brand_new' THEN 'brand_new'::item_condition
    WHEN 'refurbished' THEN 'refurbished'::item_condition
    WHEN 'local_used' THEN 'local_used'::item_condition
    WHEN 'foreign_used' THEN 'used'::item_condition
    WHEN 'used' THEN 'used'::item_condition
    WHEN 'used_excellent' THEN 'like_new'::item_condition
    WHEN 'used_good' THEN 'good'::item_condition
    WHEN 'used_fair' THEN 'fair'::item_condition
    WHEN 'used_poor' THEN 'poor'::item_condition
    WHEN 'good' THEN 'good'::item_condition
    WHEN 'fair' THEN 'fair'::item_condition
    WHEN 'poor' THEN 'poor'::item_condition
    ELSE 'used'::item_condition
  END;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION normalize_delivery_method(p_delivery_method text)
RETURNS delivery_method
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_delivery_method
    WHEN 'local_pickup' THEN 'local_pickup'::delivery_method
    WHEN 'pickup' THEN 'local_pickup'::delivery_method
    WHEN 'shipping' THEN 'shipping'::delivery_method
    WHEN 'delivery' THEN 'shipping'::delivery_method
    WHEN 'both' THEN 'both'::delivery_method
    ELSE 'local_pickup'::delivery_method
  END;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION "save_listing_with_fields"(
  p_operation text,
  p_listing_id uuid DEFAULT NULL,
  p_title text DEFAULT '',
  p_description text DEFAULT '',
  p_category_id uuid DEFAULT NULL,
  p_price_cents integer DEFAULT 0,
  p_delivery_method text DEFAULT 'local_pickup',
  p_condition text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_idempotency_key text DEFAULT NULL
) RETURNS listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id uuid;
  v_validation jsonb;
  v_valid boolean;
  v_listing_id uuid;
  v_existing_id uuid;
  v_current_status text;
  v_new_status text;
BEGIN
  -- 1. Authenticate via auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in to create or update a listing.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  -- 2. Validate operation type
  IF p_operation NOT IN ('create', 'update') THEN
    RETURN ROW(false, NULL, 'invalid_operation', 'Operation must be "create" or "update".', '[]'::jsonb)::listing_mutation_result;
  END IF;

  -- 3. For updates, verify ownership and preserve current status
  IF p_operation = 'update' THEN
    IF p_listing_id IS NULL THEN
      RETURN ROW(false, NULL, 'missing_listing_id', 'Listing id is required for updates.', '[]'::jsonb)::listing_mutation_result;
    END IF;
    SELECT seller_id, status INTO v_user_id, v_current_status FROM listings WHERE id = p_listing_id;
    IF v_user_id IS NULL THEN
      RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::listing_mutation_result;
    END IF;
    IF v_user_id <> auth.uid() THEN
      RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::listing_mutation_result;
    END IF;
    -- Preserve status on update: only bump to pending_review if currently draft
    IF v_current_status = 'draft' THEN
      v_new_status := 'pending_review';
    ELSE
      v_new_status := v_current_status;
    END IF;
  END IF;

  -- 4. Idempotency check for creates
  IF p_operation = 'create' AND p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM listings
    WHERE metadata->>'_idempotency_key' = p_idempotency_key
    LIMIT 1;
    IF FOUND THEN
      RETURN ROW(true, v_existing_id, NULL, NULL, '[]'::jsonb)::listing_mutation_result;
    END IF;
  END IF;

  -- 5. Server-side field validation
  v_validation := validate_listing_fields(p_category_id, p_metadata, p_condition);
  v_valid := (v_validation->>'valid')::boolean;
  IF NOT v_valid THEN
    RETURN ROW(false, NULL, 'validation_failed', 'One or more fields are invalid.', v_validation->'errors')::listing_mutation_result;
  END IF;

  -- 6. Attach idempotency key to metadata so repeated requests are idempotent.
  IF p_idempotency_key IS NOT NULL THEN
    p_metadata := jsonb_set(
      COALESCE(p_metadata, '{}'::jsonb),
      '{_idempotency_key}',
      to_jsonb(p_idempotency_key)
    );
  END IF;

  -- 7. Execute the mutation inside a subtransaction.
  BEGIN
    IF p_operation = 'create' THEN
      INSERT INTO listings (
        seller_id, title, description, category_id, condition, price,
        delivery_method, status, monetization_type, monetization_status,
        images, metadata, created_at, updated_at
      ) VALUES (
        auth.uid(),
        trim(p_title),
        trim(p_description),
        p_category_id,
        normalize_listing_condition(p_condition),
        p_price_cents,
        normalize_delivery_method(p_delivery_method),
        'pending_review'::listing_status,
        'fixed_rate'::monetization_type,
        'pending_paid'::monetization_status,
        '{}',
        p_metadata,
        now(),
        now()
      )
      RETURNING id INTO v_listing_id;
    ELSE
      UPDATE listings SET
        title = trim(p_title),
        description = trim(p_description),
        category_id = p_category_id,
        condition = normalize_listing_condition(p_condition),
        price = p_price_cents,
        delivery_method = normalize_delivery_method(p_delivery_method),
        status = v_new_status::listing_status,
        metadata = p_metadata,
        updated_at = now()
      WHERE id = p_listing_id AND seller_id = auth.uid()
      RETURNING id INTO v_listing_id;
    END IF;

    RETURN ROW(true, v_listing_id, NULL, NULL, '[]'::jsonb)::listing_mutation_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN ROW(false, NULL, 'internal_error', SQLERRM, '[]'::jsonb)::listing_mutation_result;
  END;
END;
$$;
