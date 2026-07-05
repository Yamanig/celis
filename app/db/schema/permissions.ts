import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
});
