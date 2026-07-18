import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { categories } from "./categories";
import { categoryFees } from "./platform-configs";
import {
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
    condition: varchar("condition", { length: 100 }),
    price: integer("price").notNull(), // USD cents
    monetizationType: monetizationTypeEnum("monetization_type")
      .notNull()
      .default("fixed_rate"),
    monetizationStatus: monetizationStatusEnum("monetization_status")
      .notNull()
      .default("pending_paid"),
    appliedFeeRuleId: uuid("applied_fee_rule_id").references(
      () => categoryFees.id,
      { onDelete: "set null" }
    ),
    feeAmountCents: integer("fee_amount_cents"),
    commissionBps: integer("commission_bps"),
    currency: varchar("currency", { length: 3 }),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    status: listingStatusEnum("status").notNull().default("draft"),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    deactivationReason: text("deactivation_reason"),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    soldToOrderId: uuid("sold_to_order_id"),
    isFeatured: boolean("is_featured").notNull().default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    featuredFeeCents: integer("featured_fee_cents"),
    locationLat: integer("location_lat"),
    locationLng: integer("location_lng"),
    images: text("images").array().notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),
    searchVector: text("search_vector"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    expiryNotifiedAt: jsonb("expiry_notified_at").$type<
      Array<{ channel: string; sentAt: string; result: string }>
    >(),
    expiryExtensionLog: jsonb("expiry_extension_log").$type<
      Array<{
        previousExpiresAt: string;
        newExpiresAt: string;
        extendedBy: string;
        reason: string;
        timestamp: string;
      }>
    >(),
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
    idxListingsFeatured: index("idx_listings_featured").on(
      table.status,
      table.isFeatured,
      table.featuredUntil
    ),
  })
);
