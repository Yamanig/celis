import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    parentId: uuid("parent_id"),
    metadataSchema: jsonb("metadata_schema").notNull().default({}),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxCategoriesParent: index("idx_categories_parent").on(table.parentId),
  })
);

export const categoryClosure = pgTable("category_closure", {
  ancestorId: uuid("ancestor_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  descendantId: uuid("descendant_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  depth: integer("depth").notNull(),
});
