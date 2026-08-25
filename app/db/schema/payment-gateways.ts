import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const paymentGateways = pgTable(
  "payment_gateways",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    provider: varchar("provider", { length: 40 }).notNull(),
    enabled: boolean("enabled").notNull().default(false),
    environment: varchar("environment", { length: 20 }).notNull().default("sandbox"),
    baseUrl: text("base_url").notNull(),
    merchantUidEncrypted: text("merchant_uid_encrypted").notNull(),
    apiUserIdEncrypted: text("api_user_id_encrypted").notNull(),
    apiKeyEncrypted: text("api_key_encrypted").notNull(),
    timeoutSeconds: integer("timeout_seconds").notNull().default(30),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerUnique: uniqueIndex("payment_gateways_provider_unique").on(table.provider),
    enabledProviderIdx: index("payment_gateways_enabled_provider_idx").on(
      table.enabled,
      table.provider
    ),
    environmentCheck: check(
      "payment_gateways_environment_check",
      sql`${table.environment} in ('sandbox', 'production')`
    ),
    timeoutCheck: check(
      "payment_gateways_timeout_check",
      sql`${table.timeoutSeconds} between 5 and 120`
    ),
  })
);

export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type NewPaymentGateway = typeof paymentGateways.$inferInsert;
