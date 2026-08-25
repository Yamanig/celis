ALTER TABLE "wallet_payments" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(160);--> statement-breakpoint
ALTER TABLE "wallet_payments" ADD COLUMN IF NOT EXISTS "invoice_id" varchar(100);--> statement-breakpoint
ALTER TABLE "wallet_payments" ADD COLUMN IF NOT EXISTS "provider_response_code" varchar(20);--> statement-breakpoint
ALTER TABLE "wallet_payments" ADD COLUMN IF NOT EXISTS "provider_state" varchar(40);--> statement-breakpoint
ALTER TABLE "wallet_payments" ADD COLUMN IF NOT EXISTS "provider_error" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wallet_payments_idempotency" ON "wallet_payments" USING btree ("idempotency_key");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_payments" ADD CONSTRAINT "wallet_payments_idempotency_key_unique" UNIQUE("idempotency_key");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
