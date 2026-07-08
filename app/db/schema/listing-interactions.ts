import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { listings } from "./listings";
import { users } from "./users";
import { interactionTypeEnum } from "./enums";

export const listingInteractions = pgTable(
  "listing_interactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: interactionTypeEnum("type").notNull(),
    phone: text("phone"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxListingInteractionsListingId: index(
      "idx_listing_interactions_listing_id"
    ).on(table.listingId),
    idxListingInteractionsUserId: index(
      "idx_listing_interactions_user_id"
    ).on(table.userId),
    idxListingInteractionsType: index("idx_listing_interactions_type").on(
      table.type
    ),
    idxListingInteractionsCreatedAt: index(
      "idx_listing_interactions_created_at"
    ).on(table.createdAt),
  })
);
