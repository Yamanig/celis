CREATE OR REPLACE FUNCTION enforce_unpaid_listing_draft()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.monetization_status = 'pending_paid'::monetization_status THEN
    NEW.status := 'draft'::listing_status;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS listings_unpaid_stay_draft ON listings;
--> statement-breakpoint
CREATE TRIGGER listings_unpaid_stay_draft
BEFORE INSERT OR UPDATE OF status, monetization_status ON listings
FOR EACH ROW EXECUTE FUNCTION enforce_unpaid_listing_draft();
--> statement-breakpoint
UPDATE listings
SET status = 'draft'::listing_status, updated_at = now()
WHERE monetization_status = 'pending_paid'::monetization_status
  AND status IN ('pending_review'::listing_status, 'active'::listing_status);
