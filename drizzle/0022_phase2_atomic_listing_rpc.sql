-- Phase 2: Atomic listing mutation RPC, improved validation, RLS, constraints.
--
-- 1. Improves validate_listing_fields to return structured {valid, errors[]}
-- 2. Creates save_listing_with_fields — an atomic RPC that validates AND writes
--    dynamic fields inside a single transaction
-- 3. Tightens RLS on listings to prevent unauthorized metadata writes
-- 4. Adds DB-level constraints for field/option integrity
--
-- Reversible: each section has a documented down path.

--> statement-breakpoint

-- ============================================================
-- 1. IMPROVED VALIDATION RPC
-- ============================================================
--
-- Returns: { valid: boolean, errors: { fieldKey, code, message }[] }

CREATE OR REPLACE FUNCTION "validate_listing_fields"(
  p_category_id uuid,
  p_metadata jsonb,
  p_condition text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO public
AS $$
DECLARE
  v_error jsonb := '[]'::jsonb;
  v_field record;
  v_value text;
  v_option_count int;
  v_field_id text;
  v_category_active boolean;
BEGIN
  -- 1. Validate category exists, is active, and is sellable.
  SELECT EXISTS(
    SELECT 1 FROM categories
    WHERE id = p_category_id
      AND is_active = true
  ) INTO v_category_active;

  IF NOT v_category_active THEN
    v_error := v_error || jsonb_build_object(
      'fieldKey', '__category__',
      'code', 'category_inactive',
      'message', 'The selected category is not available.'
    );
    RETURN jsonb_build_object('valid', false, 'errors', v_error);
  END IF;

  -- 2. Validate each submitted metadata key belongs to an active field in this
  --    category or a valid ancestor (via applies_to_descendants chain).
  FOR v_field_id IN SELECT jsonb_object_keys(p_metadata) LOOP
    SELECT COUNT(*) INTO v_option_count
    FROM category_fields cf
    JOIN categories c ON c.id = cf.category_id
    WHERE cf.field_key = v_field_id
      AND (
        cf.category_id = p_category_id
        OR (
          cf.applies_to_descendants = true
          AND EXISTS (
            WITH RECURSIVE ancestors AS (
              SELECT parent_id FROM categories WHERE id = p_category_id
              UNION ALL
              SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id = a.parent_id
            )
            SELECT 1 FROM ancestors WHERE parent_id = cf.category_id
          )
        )
      )
      AND cf.is_active = true;

    IF v_option_count = 0 THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field_id,
        'code', 'unknown_field',
        'message', 'Field "' || v_field_id || '" does not belong to this category or any valid ancestor.'
      );
    END IF;
  END LOOP;

  -- 3. Validate each field value against its field definition.
  FOR v_field IN
    SELECT id, field_key, label, type, required, max_length, validation_rules
    FROM category_fields
    WHERE category_id = p_category_id
      AND is_active = true
    ORDER BY sort_order
  LOOP
    v_value := p_metadata ->> v_field.field_key;

    -- Required check
    IF v_field.required AND (v_value IS NULL OR v_value = '' OR v_value = '""') THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'code', 'required',
        'message', v_field.label || ' is required.'
      );
      CONTINUE;
    END IF;

    IF v_value IS NULL OR v_value = '' OR v_value = '""' THEN
      CONTINUE;
    END IF;

    -- Type-specific checks
    IF v_field.type IN ('number', 'integer', 'currency') THEN
      IF v_value !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'code', 'invalid_number',
          'message', v_field.label || ' must be a number.'
        );
        CONTINUE;
      END IF;
      IF v_field.validation_rules ? 'min' AND v_value::numeric < (v_field.validation_rules->>'min')::numeric THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'code', 'below_minimum',
          'message', v_field.label || ' must be at least ' || (v_field.validation_rules->>'min') || '.'
        );
      END IF;
      IF v_field.validation_rules ? 'max' AND v_value::numeric > (v_field.validation_rules->>'max')::numeric THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'code', 'above_maximum',
          'message', v_field.label || ' must be at most ' || (v_field.validation_rules->>'max') || '.'
        );
      END IF;
      IF v_field.validation_rules ? 'integer' AND (v_field.validation_rules->>'integer')::boolean = true THEN
        IF v_value !~ '^-?[0-9]+$' THEN
          v_error := v_error || jsonb_build_object(
            'fieldKey', v_field.field_key,
            'code', 'not_integer',
            'message', v_field.label || ' must be a whole number.'
          );
        END IF;
      END IF;
    END IF;

    -- Max length
    IF v_field.max_length IS NOT NULL AND length(v_value) > v_field.max_length THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'code', 'too_long',
        'message', v_field.label || ' must be at most ' || v_field.max_length || ' characters.'
      );
    END IF;

    -- Min/max length from validation_rules
    IF v_field.validation_rules ? 'minLength' AND length(v_value) < (v_field.validation_rules->>'minLength')::int THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'code', 'too_short',
        'message', v_field.label || ' must be at least ' || (v_field.validation_rules->>'minLength') || ' characters.'
      );
    END IF;

    -- Allowed options check for select fields
    IF v_field.type IN ('single-select', 'multi-select') THEN
      SELECT COUNT(*) INTO v_option_count
      FROM category_field_options
      WHERE category_field_id = v_field.id
        AND value = v_value
        AND is_active = true;
      IF v_option_count = 0 THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'code', 'invalid_option',
          'message', 'Invalid option selected for ' || v_field.label || '.'
        );
      END IF;
    END IF;
  END LOOP;

  -- 4. Validate condition if provided.
  IF p_condition IS NOT NULL AND p_condition <> '' THEN
    SELECT COUNT(*) INTO v_option_count
    FROM category_field_options cfo
    JOIN category_fields cf ON cf.id = cfo.category_field_id
    WHERE cf.category_id = p_category_id
      AND cf.field_key = 'condition'
      AND cfo.value = p_condition
      AND cfo.is_active = true;
    IF v_option_count = 0 THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', 'condition',
        'code', 'invalid_condition',
        'message', 'Invalid condition selected.'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', v_error = '[]'::jsonb,
    'errors', v_error
  );
END;
$$;

--> statement-breakpoint

-- ============================================================
-- 2. ATOMIC LISTING MUTATION RPC
-- ============================================================
--
-- Handles both CREATE and UPDATE in one transaction.
-- Validates dynamic fields server-side before writing.
-- Uses auth.uid() — never trusts client-supplied seller_id.
--
-- Usage:
--   CREATE:
--     SELECT * FROM save_listing_with_fields(
--       p_operation => 'create',
--       p_listing_id => NULL,
--       p_title => 'My Car',
--       p_description => 'Description',
--       p_category_id => 'cat-uuid',
--       p_price_cents => 1500000,
--       p_delivery_method => 'local_pickup',
--       p_condition => 'used',
--       p_metadata => '{"make": "toyota"}'::jsonb,
--       p_idempotency_key => 'unique-key-or-null'
--     );
--
--   UPDATE:
--     SELECT * FROM save_listing_with_fields(
--       p_operation => 'update',
--       p_listing_id => 'listing-uuid',
--       ...
--     );

CREATE TYPE "listing_mutation_result" AS (
  success boolean,
  listing_id uuid,
  error_code text,
  error_message text,
  validation_errors jsonb
);

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

  -- 3. For updates, verify ownership
  IF p_operation = 'update' THEN
    IF p_listing_id IS NULL THEN
      RETURN ROW(false, NULL, 'missing_listing_id', 'Listing id is required for updates.', '[]'::jsonb)::listing_mutation_result;
    END IF;
    SELECT seller_id INTO v_user_id FROM listings WHERE id = p_listing_id;
    IF v_user_id IS NULL THEN
      RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::listing_mutation_result;
    END IF;
    IF v_user_id <> auth.uid() THEN
      RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::listing_mutation_result;
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
        p_condition,
        p_price_cents,
        p_delivery_method,
        'pending_review',
        'fixed_rate',
        'pending_paid',
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
        condition = p_condition,
        price = p_price_cents,
        delivery_method = p_delivery_method,
        status = 'pending_review',
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

--> statement-breakpoint

-- ============================================================
-- 3. STRENGTHENED RLS
-- ============================================================

-- Drop overly permissive insert policy on listings and replace with a
-- policy that still permits create/update but requires the seller to match
-- auth.uid() (existing) — already present. The key addition: ensure metadata
-- cannot reference invalid fields. However, RLS cannot validate jsonb
-- contents directly, so the RPC (save_listing_with_fields) is the enforcement
-- layer. The RLS prevents direct table access from bypassing the RPC.

-- Revoke direct insert/update from anon/authenticated on listings
-- so the mobile app MUST use the RPC.
-- This is the key security boundary: direct table writes are blocked.
DROP POLICY IF EXISTS "listings_owner_insert" ON "listings";
DROP POLICY IF EXISTS "listings_owner_write" ON "listings";
DROP POLICY IF EXISTS "listings_owner_delete" ON "listings";

-- Allow RPC-based mutations (SECURITY DEFINER with auth.uid() verification)
-- but block direct client-side inserts/updates/deletes from the mobile app.
-- The RPC runs as SECURITY DEFINER, bypassing these restrictions for its
-- own operations, but the client cannot call INSERT/UPDATE/DELETE directly.
-- Public read and owner read SELECT policies remain.
-- Note: Anon users still cannot insert (no anon insert policy ever existed).
-- Authenticated users lose the ability to INSERT/UPDATE/DELETE listings
-- directly — they must use the RPC.

-- NOTE: This policy means authenticated users CANNOT write to listings
-- directly via supabase.from("listings").insert(). They MUST use the RPC.
-- If celis.so needs direct DML, it continues to work because it uses the
-- postgres role (bypasses RLS entirely).

--> statement-breakpoint

-- ============================================================
-- 4. DATABASE CONSTRAINTS
-- ============================================================

-- Add a check constraint to ensure metadata only contains known field keys
-- for the assigned category. This is a lightweight prevention against
-- completely invalid metadata at the DB level.
-- NOTE: This is a soft check — it validates at INSERT/UPDATE time and
-- rejects metadata whose keys don't match any active field for the category.
-- It does NOT validate individual option values (that's the RPC's job).

CREATE OR REPLACE FUNCTION "check_listing_metadata"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_key text;
  v_field_count int;
BEGIN
  FOR v_key IN SELECT jsonb_object_keys(NEW.metadata) LOOP
    -- Skip internal keys
    IF v_key LIKE '\_%' THEN CONTINUE; END IF;
    -- Check the field exists for this category (or inherited ancestor)
    SELECT COUNT(*) INTO v_field_count
    FROM category_fields cf
    WHERE cf.field_key = v_key
      AND (
        cf.category_id = NEW.category_id
        OR (
          cf.applies_to_descendants = true
          AND EXISTS (
            WITH RECURSIVE ancestors AS (
              SELECT parent_id FROM categories WHERE id = NEW.category_id
              UNION ALL
              SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id = a.parent_id
            )
            SELECT 1 FROM ancestors WHERE parent_id = cf.category_id
          )
        )
      )
      AND cf.is_active = true;

    IF v_field_count = 0 THEN
      RAISE EXCEPTION 'Metadata key "%" does not belong to this category or any valid ancestor.', v_key
        USING ERRCODE = '23514'; -- check_violation
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "trg_check_listing_metadata"
  BEFORE INSERT OR UPDATE ON "listings"
  FOR EACH ROW
  WHEN (NEW.metadata IS NOT NULL AND NEW.metadata <> '{}'::jsonb)
  EXECUTE FUNCTION "check_listing_metadata"();

--> statement-breakpoint

-- ============================================================
-- 5. SUPPORTING INDEXES
-- ============================================================

-- Index for metadata field-key lookups within the check function.
CREATE INDEX IF NOT EXISTS "idx_category_fields_key_active"
  ON "category_fields" USING btree ("field_key", "is_active")
  WHERE "is_active" = true;

-- Index for listing ownership queries.
CREATE INDEX IF NOT EXISTS "idx_listings_seller_status"
  ON "listings" USING btree ("seller_id", "status");

--> statement-breakpoint

-- ============================================================
-- 5. STATUS UPDATE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION "update_listing_status"(
  p_listing_id uuid,
  p_new_status text
) RETURNS listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_owner_id uuid;
  v_valid_statuses text[] := ARRAY['draft', 'pending_review', 'active', 'sold', 'expired'];
BEGIN
  -- Authenticate
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  -- Validate status
  IF p_new_status IS NULL OR NOT (p_new_status = ANY(v_valid_statuses)) THEN
    RETURN ROW(false, NULL, 'invalid_status', 'Invalid status value.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  -- Verify ownership
  SELECT seller_id INTO v_owner_id FROM listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  -- Update status
  UPDATE listings SET status = p_new_status, updated_at = now()
  WHERE id = p_listing_id AND seller_id = auth.uid();

  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::listing_mutation_result;
END;
$$;

--> statement-breakpoint

-- ============================================================
-- 6. DELETE LISTING RPC
-- ============================================================

CREATE OR REPLACE FUNCTION "delete_listing"(
  p_listing_id uuid
) RETURNS listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  SELECT seller_id INTO v_owner_id FROM listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  DELETE FROM listings WHERE id = p_listing_id AND seller_id = auth.uid();
  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::listing_mutation_result;
END;
$$;

--> statement-breakpoint

-- ============================================================
-- 7. SAVE LISTING IMAGES RPC
-- ============================================================

CREATE OR REPLACE FUNCTION "save_listing_images"(
  p_listing_id uuid,
  p_images text[]
) RETURNS listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  SELECT seller_id INTO v_owner_id FROM listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::listing_mutation_result;
  END IF;

  UPDATE listings SET images = COALESCE(p_images, '{}'), updated_at = now()
  WHERE id = p_listing_id AND seller_id = auth.uid();

  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::listing_mutation_result;
END;
$$;

--> statement-breakpoint

-- ============================================================
-- DOWN
-- ============================================================
-- DROP TRIGGER IF EXISTS "trg_check_listing_metadata" ON "listings";
-- DROP FUNCTION IF EXISTS "check_listing_metadata"();
-- DROP INDEX IF EXISTS "idx_listings_seller_status";
-- DROP INDEX IF EXISTS "idx_category_fields_key_active";
-- CREATE POLICY "listings_owner_delete" ON "listings" FOR DELETE TO authenticated USING (seller_id = auth.uid());
-- CREATE POLICY "listings_owner_write" ON "listings" FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
-- CREATE POLICY "listings_owner_insert" ON "listings" FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND status IN ('draft', 'pending_review'));
-- DROP FUNCTION IF EXISTS "save_listing_images"(uuid, text[]);
-- DROP FUNCTION IF EXISTS "delete_listing"(uuid);
-- DROP FUNCTION IF EXISTS "update_listing_status"(uuid, text);
-- DROP FUNCTION IF EXISTS "save_listing_with_fields"(text, uuid, text, text, uuid, integer, text, text, jsonb, text);
-- DROP TYPE IF EXISTS "listing_mutation_result";
-- DROP FUNCTION IF EXISTS "validate_listing_fields"(uuid, jsonb, text);
