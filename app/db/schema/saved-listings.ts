import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";

/**
 * Mobile app (React Native / Expo) saved listings.
 *
 * Lets buyers persist saved listings to the server so the "Saved" tab
 * survives device changes / re-installs. This is additive and has no
 * dependency on any existing web-app flow.
 */
export const savedListings = pgTable(
  "saved_listings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserListing: uniqueIndex("idx_saved_listings_user_listing").on(
      table.userId,
      table.listingId
    ),
  })
);
