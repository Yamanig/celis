-- 0038_harden_definer_functions.sql
--
-- SEC-11: the listing RPCs are SECURITY DEFINER but were created with
--   SET search_path TO public
-- A definer function whose search_path includes a schema that untrusted roles
-- can write to is a privilege-escalation vector (the Supabase linter flags it as
-- "function_search_path_mutable"). This migration recreates every definer /
-- trigger function in the listing pipeline with
--   SET search_path = ''
-- and every object reference fully schema-qualified (public.* / auth.*).
-- pg_catalog stays implicitly first in the path, so built-in functions and
-- types (now(), trim(), jsonb*, text, uuid, ...) do not need qualifying.
--
-- The three WHEN OTHERS handlers no longer return raw SQLERRM to the client;
-- they RAISE LOG the detail server-side and return a generic message.
--
-- Function bodies are otherwise identical to their latest prior definitions:
--   normalize_listing_condition / normalize_delivery_method  -> 0024
--   save_listing_with_fields                                 -> 0024
--   validate_listing_fields                                  -> 0023
--   sync_category_fields_to_metadata                          -> 0023
--   update_listing_status / delete_listing / save_listing_images
--   check_listing_metadata                                   -> 0022
--
-- ----------------------------------------------------------------
-- BEFORE APPLYING TO PRODUCTION
-- ----------------------------------------------------------------
-- The Drizzle journal is desynced (audit DB-3); apply by hand and TEST FIRST:
--   1. Run this file against a scratch copy / branch of the database.
--   2. Exercise: save_listing_with_fields('create' ...), ('update' ...),
--      update_listing_status, delete_listing, save_listing_images, and a
--      category_fields edit (fires sync_category_fields_to_metadata) +
--      a listings insert with metadata (fires check_listing_metadata).
--   3. Confirm the Supabase advisor no longer reports
--      function_search_path_mutable for any of these.
--   4. Then:  psql "$DIRECT_URL" -f drizzle/0038_harden_definer_functions.sql
-- Rollback: drizzle/0038_harden_definer_functions.down.sql

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.normalize_listing_condition(p_condition text)
RETURNS public.item_condition
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN CASE p_condition
    WHEN 'new_with_tags' THEN 'new_with_tags'::public.item_condition
    WHEN 'like_new' THEN 'like_new'::public.item_condition
    WHEN 'brand_new' THEN 'brand_new'::public.item_condition
    WHEN 'refurbished' THEN 'refurbished'::public.item_condition
    WHEN 'local_used' THEN 'local_used'::public.item_condition
    WHEN 'foreign_used' THEN 'used'::public.item_condition
    WHEN 'used' THEN 'used'::public.item_condition
    WHEN 'used_excellent' THEN 'like_new'::public.item_condition
    WHEN 'used_good' THEN 'good'::public.item_condition
    WHEN 'used_fair' THEN 'fair'::public.item_condition
    WHEN 'used_poor' THEN 'poor'::public.item_condition
    WHEN 'good' THEN 'good'::public.item_condition
    WHEN 'fair' THEN 'fair'::public.item_condition
    WHEN 'poor' THEN 'poor'::public.item_condition
    ELSE 'used'::public.item_condition
  END;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.normalize_delivery_method(p_delivery_method text)
RETURNS public.delivery_method
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN CASE p_delivery_method
    WHEN 'local_pickup' THEN 'local_pickup'::public.delivery_method
    WHEN 'pickup' THEN 'local_pickup'::public.delivery_method
    WHEN 'shipping' THEN 'shipping'::public.delivery_method
    WHEN 'delivery' THEN 'shipping'::public.delivery_method
    WHEN 'both' THEN 'both'::public.delivery_method
    ELSE 'local_pickup'::public.delivery_method
  END;
END;
$$;

--> statement-breakpoint

-- validate_listing_fields — latest body from 0023, qualified.
CREATE OR REPLACE FUNCTION public.validate_listing_fields(
  p_category_id uuid,
  p_metadata jsonb,
  p_condition text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_error jsonb := '[]'::jsonb;
  v_field record;
  v_value text;
  v_option_count int;
  v_field_id text;
  v_category_active boolean;
  v_opt text;
  v_selected_values text[];
  v_invalid bool;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.categories
    WHERE id = p_category_id
  ) INTO v_category_active;

  IF NOT v_category_active THEN
    v_error := v_error || jsonb_build_object(
      'fieldKey', '__category__',
      'code', 'category_not_found',
      'message', 'The selected category was not found.'
    );
    RETURN jsonb_build_object('valid', false, 'errors', v_error);
  END IF;

  FOR v_field_id IN SELECT jsonb_object_keys(p_metadata) LOOP
    IF v_field_id LIKE '\_%' THEN CONTINUE; END IF;

    SELECT COUNT(*) INTO v_option_count
    FROM public.category_fields cf
    JOIN public.categories c ON c.id = cf.category_id
    WHERE cf.field_key = v_field_id
      AND (
        cf.category_id = p_category_id
        OR (
          cf.applies_to_descendants = true
          AND EXISTS (
            WITH RECURSIVE ancestors AS (
              SELECT parent_id FROM public.categories WHERE id = p_category_id
              UNION ALL
              SELECT c.parent_id FROM public.categories c JOIN ancestors a ON c.id = a.parent_id
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

  FOR v_field IN
    SELECT id, field_key, label, type, required, max_length, validation_rules
    FROM public.category_fields
    WHERE category_id = p_category_id
      AND is_active = true
    ORDER BY sort_order
  LOOP
    v_value := p_metadata ->> v_field.field_key;

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

    IF v_field.max_length IS NOT NULL AND length(v_value) > v_field.max_length THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'code', 'too_long',
        'message', v_field.label || ' must be at most ' || v_field.max_length || ' characters.'
      );
    END IF;

    IF v_field.validation_rules ? 'minLength' AND length(v_value) < (v_field.validation_rules->>'minLength')::int THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'code', 'too_short',
        'message', v_field.label || ' must be at least ' || (v_field.validation_rules->>'minLength') || ' characters.'
      );
    END IF;

    IF v_field.type IN ('single-select', 'multi-select') THEN
      IF v_field.type = 'multi-select' THEN
        v_invalid := false;
        v_selected_values := string_to_array(v_value, ',');
        FOR v_opt IN SELECT unnest(v_selected_values) LOOP
          v_opt := trim(v_opt);
          IF v_opt = '' THEN CONTINUE; END IF;
          SELECT COUNT(*) INTO v_option_count
          FROM public.category_field_options
          WHERE category_field_id = v_field.id
            AND value = v_opt
            AND is_active = true;
          IF v_option_count = 0 THEN
            v_error := v_error || jsonb_build_object(
              'fieldKey', v_field.field_key,
              'code', 'invalid_option',
              'message', 'Invalid option "' || v_opt || '" selected for ' || v_field.label || '.'
            );
            v_invalid := true;
          END IF;
        END LOOP;

        IF NOT v_invalid THEN
          IF v_field.validation_rules ? 'minSelections' AND
             array_length(v_selected_values, 1) < (v_field.validation_rules->>'minSelections')::int THEN
            v_error := v_error || jsonb_build_object(
              'fieldKey', v_field.field_key,
              'code', 'below_min_selections',
              'message', v_field.label || ' requires at least ' || (v_field.validation_rules->>'minSelections') || ' selections.'
            );
          END IF;
          IF v_field.validation_rules ? 'maxSelections' AND
             array_length(v_selected_values, 1) > (v_field.validation_rules->>'maxSelections')::int THEN
            v_error := v_error || jsonb_build_object(
              'fieldKey', v_field.field_key,
              'code', 'above_max_selections',
              'message', v_field.label || ' allows at most ' || (v_field.validation_rules->>'maxSelections') || ' selections.'
            );
          END IF;
        END IF;
      ELSE
        SELECT COUNT(*) INTO v_option_count
        FROM public.category_field_options
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
    END IF;
  END LOOP;

  IF p_condition IS NOT NULL AND p_condition <> '' THEN
    SELECT COUNT(*) INTO v_option_count
    FROM public.category_field_options cfo
    JOIN public.category_fields cf ON cf.id = cfo.category_field_id
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

-- save_listing_with_fields — latest body from 0024, qualified.
CREATE OR REPLACE FUNCTION public.save_listing_with_fields(
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
) RETURNS public.listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in to create or update a listing.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  IF p_operation NOT IN ('create', 'update') THEN
    RETURN ROW(false, NULL, 'invalid_operation', 'Operation must be "create" or "update".', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  IF p_operation = 'update' THEN
    IF p_listing_id IS NULL THEN
      RETURN ROW(false, NULL, 'missing_listing_id', 'Listing id is required for updates.', '[]'::jsonb)::public.listing_mutation_result;
    END IF;
    SELECT seller_id, status INTO v_user_id, v_current_status FROM public.listings WHERE id = p_listing_id;
    IF v_user_id IS NULL THEN
      RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::public.listing_mutation_result;
    END IF;
    IF v_user_id <> auth.uid() THEN
      RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::public.listing_mutation_result;
    END IF;
    IF v_current_status = 'draft' THEN
      v_new_status := 'pending_review';
    ELSE
      v_new_status := v_current_status;
    END IF;
  END IF;

  IF p_operation = 'create' AND p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.listings
    WHERE metadata->>'_idempotency_key' = p_idempotency_key
    LIMIT 1;
    IF FOUND THEN
      RETURN ROW(true, v_existing_id, NULL, NULL, '[]'::jsonb)::public.listing_mutation_result;
    END IF;
  END IF;

  v_validation := public.validate_listing_fields(p_category_id, p_metadata, p_condition);
  v_valid := (v_validation->>'valid')::boolean;
  IF NOT v_valid THEN
    RETURN ROW(false, NULL, 'validation_failed', 'One or more fields are invalid.', v_validation->'errors')::public.listing_mutation_result;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    p_metadata := jsonb_set(
      COALESCE(p_metadata, '{}'::jsonb),
      '{_idempotency_key}',
      to_jsonb(p_idempotency_key)
    );
  END IF;

  BEGIN
    IF p_operation = 'create' THEN
      INSERT INTO public.listings (
        seller_id, title, description, category_id, condition, price,
        delivery_method, status, monetization_type, monetization_status,
        images, metadata, created_at, updated_at
      ) VALUES (
        auth.uid(),
        trim(p_title),
        trim(p_description),
        p_category_id,
        public.normalize_listing_condition(p_condition),
        p_price_cents,
        public.normalize_delivery_method(p_delivery_method),
        'pending_review'::public.listing_status,
        'fixed_rate'::public.monetization_type,
        'pending_paid'::public.monetization_status,
        '{}',
        p_metadata,
        now(),
        now()
      )
      RETURNING id INTO v_listing_id;
    ELSE
      UPDATE public.listings SET
        title = trim(p_title),
        description = trim(p_description),
        category_id = p_category_id,
        condition = public.normalize_listing_condition(p_condition),
        price = p_price_cents,
        delivery_method = public.normalize_delivery_method(p_delivery_method),
        status = v_new_status::public.listing_status,
        metadata = p_metadata,
        updated_at = now()
      WHERE id = p_listing_id AND seller_id = auth.uid()
      RETURNING id INTO v_listing_id;
    END IF;

    RETURN ROW(true, v_listing_id, NULL, NULL, '[]'::jsonb)::public.listing_mutation_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'save_listing_with_fields failed (op=%, listing=%): %', p_operation, p_listing_id, SQLERRM;
      RETURN ROW(false, NULL, 'internal_error', 'Something went wrong saving the listing.', '[]'::jsonb)::public.listing_mutation_result;
  END;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.update_listing_status(
  p_listing_id uuid,
  p_new_status text
) RETURNS public.listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
  v_valid_statuses text[] := ARRAY['draft', 'pending_review', 'active', 'sold', 'expired'];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  IF p_new_status IS NULL OR NOT (p_new_status = ANY(v_valid_statuses)) THEN
    RETURN ROW(false, NULL, 'invalid_status', 'Invalid status value.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  SELECT seller_id INTO v_owner_id FROM public.listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  UPDATE public.listings SET status = p_new_status::public.listing_status, updated_at = now()
  WHERE id = p_listing_id AND seller_id = auth.uid();

  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::public.listing_mutation_result;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.delete_listing(
  p_listing_id uuid
) RETURNS public.listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  SELECT seller_id INTO v_owner_id FROM public.listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  DELETE FROM public.listings WHERE id = p_listing_id AND seller_id = auth.uid();
  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::public.listing_mutation_result;
END;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.save_listing_images(
  p_listing_id uuid,
  p_images text[]
) RETURNS public.listing_mutation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ROW(false, NULL, 'unauthorized', 'You must be signed in.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  SELECT seller_id INTO v_owner_id FROM public.listings WHERE id = p_listing_id;
  IF v_owner_id IS NULL THEN
    RETURN ROW(false, NULL, 'not_found', 'Listing not found.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;
  IF v_owner_id <> auth.uid() THEN
    RETURN ROW(false, NULL, 'forbidden', 'You do not own this listing.', '[]'::jsonb)::public.listing_mutation_result;
  END IF;

  UPDATE public.listings SET images = COALESCE(p_images, '{}'), updated_at = now()
  WHERE id = p_listing_id AND seller_id = auth.uid();

  RETURN ROW(true, p_listing_id, NULL, NULL, '[]'::jsonb)::public.listing_mutation_result;
END;
$$;

--> statement-breakpoint

-- check_listing_metadata — trigger, latest body from 0022, qualified.
CREATE OR REPLACE FUNCTION public.check_listing_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_key text;
  v_field_count int;
BEGIN
  FOR v_key IN SELECT jsonb_object_keys(NEW.metadata) LOOP
    IF v_key LIKE '\_%' THEN CONTINUE; END IF;
    SELECT COUNT(*) INTO v_field_count
    FROM public.category_fields cf
    WHERE cf.field_key = v_key
      AND (
        cf.category_id = NEW.category_id
        OR (
          cf.applies_to_descendants = true
          AND EXISTS (
            WITH RECURSIVE ancestors AS (
              SELECT parent_id FROM public.categories WHERE id = NEW.category_id
              UNION ALL
              SELECT c.parent_id FROM public.categories c JOIN ancestors a ON c.id = a.parent_id
            )
            SELECT 1 FROM ancestors WHERE parent_id = cf.category_id
          )
        )
      )
      AND cf.is_active = true;

    IF v_field_count = 0 THEN
      RAISE EXCEPTION 'Metadata key "%" does not belong to this category or any valid ancestor.', v_key
        USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

--> statement-breakpoint

-- sync_category_fields_to_metadata — trigger, latest body from 0023, qualified.
CREATE OR REPLACE FUNCTION public.sync_category_fields_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_category_id uuid;
  field_record record;
  option_rows jsonb;
  fields_json jsonb := '[]'::jsonb;
BEGIN
  IF TG_TABLE_NAME = 'category_fields' THEN
    v_category_id := COALESCE(NEW.category_id, OLD.category_id);
  ELSE
    SELECT cf.category_id INTO v_category_id
    FROM public.category_fields cf
    WHERE cf.id = COALESCE(NEW.category_field_id, OLD.category_field_id);
  END IF;

  IF v_category_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  FOR field_record IN
    SELECT cf.id, cf.field_key, cf.label, cf.type, cf.required, cf.searchable,
           cf.max_length, cf.help_text
    FROM public.category_fields cf
    WHERE cf.category_id = v_category_id
      AND cf.is_active = true
    ORDER BY cf.sort_order, cf.label
  LOOP
    SELECT COALESCE(jsonb_agg(o.value ORDER BY o.sort_order, o.label), '[]'::jsonb)
      INTO option_rows
    FROM public.category_field_options o
    WHERE o.category_field_id = field_record.id
      AND o.is_active = true
      AND o.parent_option_id IS NULL;

    fields_json := fields_json || jsonb_build_object(
      'key', field_record.field_key,
      'type', field_record.type,
      'label', field_record.label,
      'required', field_record.required,
      'searchable', field_record.searchable,
      'maxLength', field_record.max_length,
      'helpText', field_record.help_text,
      'options', option_rows
    );
  END LOOP;

  UPDATE public.categories
  SET metadata_schema = jsonb_build_object('fields', fields_json),
      updated_at = now()
  WHERE id = v_category_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
