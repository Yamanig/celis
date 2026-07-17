import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const ROLE_DOMAINS = ["customer", "internal"] as const;
export type RoleDomain = (typeof ROLE_DOMAINS)[number];

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    domain: text("domain", { enum: ROLE_DOMAINS })
      .notNull()
      .default("internal"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex("idx_roles_key").on(table.key),
  })
);
