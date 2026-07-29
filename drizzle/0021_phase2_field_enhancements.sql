-- Phase 2: Field inheritance and validation enhancements.
--
-- Adds columns needed by the mobile app's dynamic category field system:
--   applies_to_descendants — controls ancestor-to-descendant field inheritance
--   validation_rules       — JSONB object with field-level validation config
--
-- Also adds a listing_attributes rpc for server-side validation of dynamic
-- field values on listing submission/update.
--
-- Reversible: all additions are ALTER TABLE ADD COLUMN; the down section
-- reverses them. The RPC function is dropped in the down section.

--> statement-breakpoint

-- ── category_fields enhancements ──────────────────────────────────────────

ALTER TABLE "category_fields"
  ADD COLUMN IF NOT EXISTS "applies_to_descendants" boolean NOT NULL DEFAULT true;

ALTER TABLE "category_fields"
  ADD COLUMN IF NOT EXISTS "validation_rules" jsonb DEFAULT '{}'::jsonb;

-- Index for inheritance queries (ancestor fields filtered by applies_to_descendants).
CREATE INDEX IF NOT EXISTS "idx_category_fields_inheritance"
  ON "category_fields" USING btree ("category_id", "applies_to_descendants", "sort_order");

--> statement-breakpoint

-- ── Server-side field/option validation function ──────────────────────────
--
-- Validates a submitted listing's dynamic field values against the
-- category's field definition (validation_rules, allowed options, required
-- status). Returns a JSON array of validation errors.
--
-- Usage:
--   SELECT * FROM validate_listing_fields('cat-uuid', '{"make": "toyota", "model": "corolla"}'::jsonb);

CREATE OR REPLACE FUNCTION "validate_listing_fields"(
  p_category_id uuid,
  p_metadata jsonb,
  p_condition text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_error jsonb := '[]'::jsonb;
  v_field record;
  v_value text;
  v_option_count int;
BEGIN
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
          'message', v_field.label || ' must be a number.'
        );
        CONTINUE;
      END IF;
      IF v_field.validation_rules ? 'min' AND v_value::numeric < (v_field.validation_rules->>'min')::numeric THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'message', v_field.label || ' must be at least ' || (v_field.validation_rules->>'min') || '.'
        );
      END IF;
      IF v_field.validation_rules ? 'max' AND v_value::numeric > (v_field.validation_rules->>'max')::numeric THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'message', v_field.label || ' must be at most ' || (v_field.validation_rules->>'max') || '.'
        );
      END IF;
    END IF;

    -- Max length
    IF v_field.max_length IS NOT NULL AND length(v_value) > v_field.max_length THEN
      v_error := v_error || jsonb_build_object(
        'fieldKey', v_field.field_key,
        'message', v_field.label || ' must be at most ' || v_field.max_length || ' characters.'
      );
    END IF;

    -- Allowed options check for single-select fields
    IF v_field.type IN ('single-select', 'multi-select') THEN
      SELECT COUNT(*) INTO v_option_count
      FROM category_field_options
      WHERE category_field_id = v_field.id
        AND value = v_value
        AND is_active = true;
      IF v_option_count = 0 THEN
        v_error := v_error || jsonb_build_object(
          'fieldKey', v_field.field_key,
          'message', 'Invalid option selected for ' || v_field.label || '.'
        );
      END IF;
    END IF;
  END LOOP;

  -- Condition validation (if the category has a condition field)
  IF p_condition IS NOT NULL THEN
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
        'message', 'Invalid condition selected.'
      );
    END IF;
  END IF;

  RETURN v_error;
END;
$$;

--> statement-breakpoint

-- ── RLS for listing_attributes (future use) ───────────────────────────────

-- Note: listing attributes are stored in listings.metadata (jsonb).
-- The existing RLS on listings already controls access.
-- No additional RLS changes needed unless a separate listing_attributes
-- table is introduced in a future phase.

-- ============================================================
-- DOWN
-- ============================================================
-- DROP FUNCTION IF EXISTS "validate_listing_fields"(uuid, jsonb, text);
-- DROP INDEX IF EXISTS "idx_category_fields_inheritance";
-- ALTER TABLE "category_fields" DROP COLUMN IF EXISTS "applies_to_descendants";
-- ALTER TABLE "category_fields" DROP COLUMN IF EXISTS "validation_rules";
