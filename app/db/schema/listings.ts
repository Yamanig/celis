import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { categories } from "./categories";
import {
  itemConditionEnum,
  deliveryMethodEnum,
  listingStatusEnum,
  monetizationTypeEnum,
  monetizationStatusEnum,
} from "./enums";

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    condition: itemConditionEnum("condition").notNull(),
    price: integer("price").notNull(), // USD cents
    monetizationType: monetizationTypeEnum("monetization_type").notNull(),
    monetizationStatus: monetizationStatusEnum("monetization_status")
      .notNull()
      .default("pending_paid"),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    status: listingStatusEnum("status").notNull().default("draft"),
    locationLat: integer("location_lat"),
    locationLng: integer("location_lng"),
    images: text("images").array().notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),
    searchVector: text("search_vector"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxListingsStatusCreated: index("idx_listings_status_created").on(
      table.status,
      table.createdAt
    ),
    idxListingsCategoryStatusPrice: index(
      "idx_listings_category_status_price"
    ).on(table.categoryId, table.status, table.price),
    idxListingsSearchVector: index("idx_listings_search_vector").on(
      table.searchVector
    ),
    idxListingsMetadata: index("idx_listings_metadata").on(table.metadata),
  })
);
