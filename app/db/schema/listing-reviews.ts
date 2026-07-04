import { pgTable, uuid, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { listings } from "./listings";
import { users } from "./users";

export const listingReviews = pgTable(
  "listing_reviews",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueReviewer: uniqueIndex("idx_listing_reviews_unique").on(
      table.listingId,
      table.reviewerId
    ),
  })
);
