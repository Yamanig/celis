import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories";

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "single-select",
  "multi-select",
  "photo-grid",
  "video-link",
] as const;
export type CategoryFieldType = (typeof FIELD_TYPES)[number];

export const categoryFields = pgTable(
  "category_fields",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    type: varchar("type", { length: 24 }).notNull(),
    helpText: text("help_text"),
    placeholder: text("placeholder"),
    required: boolean("required").notNull().default(false),
    searchable: boolean("searchable").notNull().default(false),
    isFilter: boolean("is_filter").notNull().default(false),
    defaultValue: varchar("default_value", { length: 255 }),
    minValue: numeric("min_value"),
    maxValue: numeric("max_value"),
    maxLength: integer("max_length"),
    sortOrder: integer("sort_order").notNull().default(0),
    parentFieldId: uuid("parent_field_id"),
    parentValue: varchar("parent_value", { length: 120 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueCategoryField: uniqueIndex("idx_category_fields_unique").on(
      table.categoryId,
      table.fieldKey
    ),
    idxCategoryFieldsCategory: index("idx_category_fields_category").on(
      table.categoryId
    ),
    idxCategoryFieldsParent: index("idx_category_fields_parent").on(
      table.parentFieldId
    ),
  })
);

export const categoryFieldOptions = pgTable(
  "category_field_options",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    categoryFieldId: uuid("category_field_id")
      .notNull()
      .references(() => categoryFields.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 120 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    group: varchar("group", { length: 24 }).notNull().default("OTHER"),
    sortOrder: integer("sort_order").notNull().default(0),
    parentOptionId: uuid("parent_option_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueOption: uniqueIndex("idx_category_field_options_unique").on(
      table.categoryFieldId,
      table.value
    ),
    idxCategoryFieldOptionsField: index(
      "idx_category_field_options_field"
    ).on(table.categoryFieldId),
    idxCategoryFieldOptionsParent: index(
      "idx_category_field_options_parent_option"
    ).on(table.parentOptionId),
  })
);
