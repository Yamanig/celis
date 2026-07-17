-- Phase 9: Dynamic, category-specific listing fields.
--
-- This migration introduces a fully dynamic field model so the mobile app and
-- celis.so can render different forms per category without hard-coded car/phone
-- logic. Field definitions live in `category_fields`; each field's option list
-- lives in `category_field_options` keyed by `category_field_id` (NOT by the
-- shared `field_key`), which allows two categories to both have a "condition"
-- field with completely different options.
--
-- Backward compatibility: celis.so still reads the `metadata_schema` jsonb on
-- `categories`. A trigger keeps `metadata_schema.fields` in sync (read-only
-- mirror) of `category_fields`, so the web app continues to work unchanged.
--
-- Reversibility: every object created here is dropped in the down section, and
-- the trigger is dropped; `metadata_schema` is left intact so celis.so keeps
-- working even if the new tables are removed.
--
-- NOTE: this file is plain SQL. Apply with the project's migration runner
-- (drizzle-kit) or `psql`. It is idempotent via IF NOT EXISTS / DO blocks.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "field_key" varchar(80) NOT NULL,
  "label" varchar(120) NOT NULL,
  "type" varchar(24) NOT NULL,
  "help_text" text,
  "placeholder" text,
  "required" boolean DEFAULT false NOT NULL,
  "searchable" boolean DEFAULT false NOT NULL,
  "is_filter" boolean DEFAULT false NOT NULL,
  "default_value" text,
  "min_value" numeric,
  "max_value" numeric,
  "max_length" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "parent_field_id" uuid,
  "parent_value" varchar(120),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_category_id_categories_id_fk"
   FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_parent_field_id_category_fields_id_fk"
   FOREIGN KEY ("parent_field_id") REFERENCES "public"."category_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_category_fields_unique"
  ON "category_fields" USING btree ("category_id","field_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_fields_category"
  ON "category_fields" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_fields_parent"
  ON "category_fields" USING btree ("parent_field_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_parent_field_id_category_fields_id_fk"
   FOREIGN KEY ("parent_field_id") REFERENCES "public"."category_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "category_field_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_field_id" uuid NOT NULL,
  "value" varchar(120) NOT NULL,
  "label" varchar(160) NOT NULL,
  "group" varchar(24) DEFAULT 'OTHER',
  "sort_order" integer DEFAULT 0 NOT NULL,
  "parent_option_id" uuid,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_field_options" ADD CONSTRAINT "category_field_options_category_field_id_category_fields_id_fk"
   FOREIGN KEY ("category_field_id") REFERENCES "public"."category_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_category_field_options_unique"
  ON "category_field_options" USING btree ("category_field_id","value");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_field_options_field"
  ON "category_field_options" USING btree ("category_field_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_field_options_parent_option"
  ON "category_field_options" USING btree ("parent_option_id");
--> statement-breakpoint

-- Reverse-sync trigger: keep celis.so's `metadata_schema` mirror in sync with
-- the new `category_fields` table. Options are folded into the field's
-- `options` array. Dependent (parent_value) fields are mirrored as plain select
-- fields so the web form still renders them.
CREATE OR REPLACE FUNCTION "sync_category_fields_to_metadata"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  field_record record;
  option_rows jsonb;
  fields_json jsonb := '[]'::jsonb;
BEGIN
  FOR field_record IN
    SELECT cf.id, cf.field_key, cf.label, cf.type, cf.required, cf.searchable,
           cf.max_length, cf.help_text
    FROM category_fields cf
    WHERE cf.category_id = COALESCE(NEW.category_id, OLD.category_id)
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
      'options', option_rows
    );
  END LOOP;

  UPDATE categories
  SET metadata_schema = jsonb_build_object('fields', fields_json),
      updated_at = now()
  WHERE id = COALESCE(NEW.category_id, OLD.category_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS "trg_sync_category_fields_to_metadata" ON "category_fields";
CREATE TRIGGER "trg_sync_category_fields_to_metadata"
  AFTER INSERT OR UPDATE OR DELETE ON "category_fields"
  FOR EACH ROW EXECUTE FUNCTION "sync_category_fields_to_metadata"();
--> statement-breakpoint

DROP TRIGGER IF EXISTS "trg_sync_category_field_options_to_metadata" ON "category_field_options";
CREATE TRIGGER "trg_sync_category_field_options_to_metadata"
  AFTER INSERT OR UPDATE OR DELETE ON "category_field_options"
  FOR EACH ROW EXECUTE FUNCTION "sync_category_fields_to_metadata"();
--> statement-breakpoint

-- ============================================================
-- ROW LEVEL SECURITY
-- Only administrators may edit the field model. Public users may read only
-- active configuration. The web app's postgres role bypasses RLS, so this does
-- not affect celis.so.
-- ============================================================
ALTER TABLE "category_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "category_field_options" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_fields_public_read" ON "category_fields";
CREATE POLICY "category_fields_public_read" ON "category_fields"
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "category_field_options_public_read" ON "category_field_options";
CREATE POLICY "category_field_options_public_read" ON "category_field_options"
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Down section (reversible migration). Uncomment to roll back:
-- DROP TRIGGER IF EXISTS "trg_sync_category_field_options_to_metadata" ON "category_field_options";
-- DROP TRIGGER IF EXISTS "trg_sync_category_fields_to_metadata" ON "category_fields";
-- DROP FUNCTION IF EXISTS "sync_category_fields_to_metadata"();
-- DROP POLICY IF EXISTS "category_field_options_public_read" ON "category_field_options";
-- DROP POLICY IF EXISTS "category_fields_public_read" ON "category_field_options";
-- DROP TABLE IF EXISTS "category_field_options";
-- DROP TABLE IF EXISTS "category_fields";
