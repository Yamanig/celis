import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  boolean,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  sellerTypeEnum,
  verificationStatusEnum,
} from "./enums";

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
  role: text("role").notNull().default("buyer"),
  isInternal: boolean("is_internal").notNull().default(false),
  createdBy: uuid("created_by").references(
    (): AnyPgColumn => users.id,
    { onDelete: "set null" }
  ),
  department: varchar("department", { length: 100 }),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  primaryBankAccountId: uuid("primary_bank_account_id"),
  walletPhone: varchar("wallet_phone", { length: 15 }),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("pending"),
  verificationRejectionReason: text("verification_rejection_reason"),
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
    sellerNumber: varchar("seller_number", { length: 20 }),
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
    sellerNumberIdx: uniqueIndex("idx_profiles_seller_number").on(
      table.sellerNumber
    ),
  })
);
