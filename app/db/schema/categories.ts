import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
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

export const categoryConditions = pgTable(
  "category_conditions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 100 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueCategoryCondition: uniqueIndex("idx_category_conditions_unique").on(
      table.categoryId,
      table.code
    ),
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
