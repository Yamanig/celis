import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { subscriptionStatusEnum } from "./enums";

export const listingPackages = pgTable("listing_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  listingAllowance: integer("listing_allowance").notNull(),
  isUnlimited: boolean("is_unlimited").notNull().default(false),
  featuredAllowance: integer("featured_allowance"),
  durationDays: integer("duration_days").notNull(),
  price: integer("price").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  gracePeriodDays: integer("grace_period_days"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveUntil: timestamp("effective_until", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sellerSubscriptions = pgTable("seller_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  packageId: uuid("package_id")
    .notNull()
    .references(() => listingPackages.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  assignmentSource: varchar("assignment_source", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 255 }),
  pricePaidCents: integer("price_paid_cents"),
  assignedBy: uuid("assigned_by").references(() => users.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
