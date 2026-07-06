import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userRoleEnum, sellerTypeEnum } from "./enums";

/**
 * Reference to Supabase Auth users.
 * Drizzle does not own this table; it is managed by Supabase Auth.
 * We declare it so we can create foreign keys from application tables.
 */
export const authUsers = pgTable("auth.users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }),
});

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  primaryBankAccountId: uuid("primary_bank_account_id"),
  walletPhone: varchar("wallet_phone", { length: 15 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 60 }).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    location: jsonb("location").$type<{
      city: string;
      region: string;
      district: string;
      lat: number;
      lng: number;
    }>(),
    phone: varchar("phone", { length: 15 }),
    sellerType: sellerTypeEnum("seller_type").default("individual"),
    businessName: varchar("business_name", { length: 120 }),
    businessLogoUrl: text("business_logo_url"),
    businessRegistrationNumber: varchar("business_registration_number", {
      length: 60,
    }),
    businessAddress: text("business_address"),
    shopSlug: varchar("shop_slug", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    shopSlugIdx: uniqueIndex("idx_profiles_shop_slug").on(table.shopSlug),
  })
);
