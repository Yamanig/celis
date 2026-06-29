import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";
import { orderStatusEnum, deliveryConfirmSourceEnum } from "./enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "restrict" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    // Immutable financial snapshot at order creation
    salePrice: integer("sale_price").notNull(), // USD cents
    commissionAmount: integer("commission_amount").notNull().default(0),
    platformFee: integer("platform_fee").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    netPayout: integer("net_payout").notNull(),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    carrier: varchar("carrier", { length: 50 }),
    labelUrl: text("label_url"),
    deliveryConfirmedBy: deliveryConfirmSourceEnum("delivery_confirmed_by"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxOrdersBuyerStatus: index("idx_orders_buyer_status").on(
      table.buyerId,
      table.status,
      table.createdAt
    ),
    idxOrdersSellerStatus: index("idx_orders_seller_status").on(
      table.sellerId,
      table.status,
      table.createdAt
    ),
    idxOrdersListing: index("idx_orders_listing").on(table.listingId),
  })
);
