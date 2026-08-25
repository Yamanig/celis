CREATE TABLE IF NOT EXISTS "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(40) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"environment" varchar(20) DEFAULT 'sandbox' NOT NULL,
	"base_url" text NOT NULL,
	"merchant_uid_encrypted" text NOT NULL,
	"api_user_id_encrypted" text NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"timeout_seconds" integer DEFAULT 30 NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateways_environment_check" CHECK ("environment" IN ('sandbox', 'production')),
	CONSTRAINT "payment_gateways_timeout_check" CHECK ("timeout_seconds" BETWEEN 5 AND 120)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_gateways" ADD CONSTRAINT "payment_gateways_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_gateways_provider_unique" ON "payment_gateways" USING btree ("provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_gateways_enabled_provider_idx" ON "payment_gateways" USING btree ("enabled","provider");
