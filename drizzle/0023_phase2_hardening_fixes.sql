-- Phase 2 hardening: fix multi-select validation and update status preservation.
--
-- 1. Fix validate_listing_fields to split comma-joined multi-select values
--    before checking allowed options.
-- 2. Fix save_listing_with_fields UPDATE path to preserve existing status
--    instead of unconditionally resetting to 'pending_review'.
-- 3. Add multi-select min/max selection count validation.
--
-- Reversible: each section uses CREATE OR REPLACE so the previous definition
-- is lost. The down section documents the prior definitions for rollback.

--> statement-breakpoint

-- ============================================================
-- 1. FIXED VALIDATION RPC
-- ============================================================
--
-- Changes from 0022 version:
--   - Multi-select values (comma-joined) are split before option validation.
--   - Individual invalid options in multi-select are reported.
--   - Multi-select min/max selection count validation added.

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
  v_opt text;
  v_selected_values text[];
  v_invalid bool;
BEGIN
  -- 1. Validate category exists.
  -- Note: The categories table has no is_active column. If soft-delete or
  -- deactivation is needed in the future, add the column and uncomment the
  -- is_active check below.
  SELECT EXISTS(
    SELECT 1 FROM categories
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

  -- 2. Validate each submitted metadata key belongs to an active field in this
  --    category or a valid ancestor (via applies_to_descendants chain).
  FOR v_field_id IN SELECT jsonb_object_keys(p_metadata) LOOP
    -- Skip internal keys (prefixed with underscore)
    IF v_field_id LIKE '\_%' THEN CONTINUE; END IF;

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

    -- Allowed options check for single-select and multi-select fields.
    -- Multi-select values arrive comma-joined ("opt1,opt2") and must be split.
    IF v_field.type IN ('single-select', 'multi-select') THEN
      IF v_field.type = 'multi-select' THEN
        -- Split comma-joined values and validate each individually
        v_invalid := false;
        v_selected_values := string_to_array(v_value, ',');
        FOR v_opt IN SELECT unnest(v_selected_values) LOOP
          v_opt := trim(v_opt);
          IF v_opt = '' THEN CONTINUE; END IF;
          SELECT COUNT(*) INTO v_option_count
          FROM category_field_options
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

        -- Multi-select min/max selection count
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
        -- Single-select: direct value comparison
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
-- 2. FIXED ATOMIC LISTING MUTATION RPC
-- ============================================================
--
-- Changes from 0022 version:
--   - UPDATE path preserves existing listing status instead of resetting
--     to 'pending_review'. Only sets pending_review if currently draft.
--   - Field-level validation errors are returned in expected error format.

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
        status = v_new_status,
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
-- 3. FIXED METADATA SYNC TRIGGER FUNCTION
-- ============================================================
--
-- Changes from 0021 version:
--   - Added TG_TABLE_NAME check: when fired from category_field_options
--     (which has no category_id column), looks up the category via
--     category_fields join instead.
--   - Guards v_category_id against NULL to avoid silent failures.

CREATE OR REPLACE FUNCTION sync_category_fields_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_id uuid;
  field_record record;
  option_rows jsonb;
  fields_json jsonb := '[]'::jsonb;
BEGIN
  -- Determine category_id based on which table fired the trigger
  IF TG_TABLE_NAME = 'category_fields' THEN
    v_category_id := COALESCE(NEW.category_id, OLD.category_id);
  ELSE
    SELECT cf.category_id INTO v_category_id
    FROM category_fields cf
    WHERE cf.id = COALESCE(NEW.category_field_id, OLD.category_field_id);
  END IF;

  IF v_category_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  FOR field_record IN
    SELECT cf.id, cf.field_key, cf.label, cf.type, cf.required, cf.searchable,
           cf.max_length, cf.help_text
    FROM category_fields cf
    WHERE cf.category_id = v_category_id
      AND cf.is_active = true
    ORDER BY cf.sort_order, cf.label
  LOOP
    SELECT COALESCE(jsonb_agg(o.value ORDER BY o.sort_order, o.label), '[]'::jsonb)
      INTO option_rows
    FROM category_field_options o
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

  UPDATE categories
  SET metadata_schema = jsonb_build_object('fields', fields_json),
      updated_at = now()
  WHERE id = v_category_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

--> statement-breakpoint

-- ============================================================
-- DOWN
-- ============================================================
-- To roll back to the 0022 definitions, run the CREATE OR REPLACE
-- statements from 0022_phase2_atomic_listing_rpc.sql for both
-- validate_listing_fields and save_listing_with_fields.
-- To roll back the trigger function, run the 0021 definition.
