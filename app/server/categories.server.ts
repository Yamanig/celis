import { db } from "~/db";
import { categories, categoryClosure, categoryConditions, listings } from "~/db/schema";
import { eq, isNull, count, sql, and, asc } from "drizzle-orm";
import type { CategoryMetadataSchema } from "~/lib/category-metadata";

export async function getRootCategories() {
  return db.select().from(categories).where(isNull(categories.parentId));
}

export async function getChildCategories(parentId: string) {
  return db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryById(id: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCategoryMetadataSchema(categoryId: string): Promise<CategoryMetadataSchema | null> {
  const rows = await db
    .select({ metadataSchema: categories.metadataSchema })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  const value = rows[0]?.metadataSchema;
  if (
    typeof value === "object" &&
    value !== null &&
    "fields" in value &&
    Array.isArray((value as CategoryMetadataSchema).fields)
  ) {
    return value as CategoryMetadataSchema;
  }
  return null;
}

export async function updateCategoryMetadataSchema(
  categoryId: string,
  schema: CategoryMetadataSchema
) {
  const [row] = await db
    .update(categories)
    .set({ metadataSchema: schema as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(categories.id, categoryId))
    .returning();
  return row;
}

export async function getCategoryConditions(categoryId: string) {
  return db
    .select()
    .from(categoryConditions)
    .where(
      and(
        eq(categoryConditions.categoryId, categoryId),
        eq(categoryConditions.isActive, true)
      )
    )
    .orderBy(asc(categoryConditions.sortOrder), asc(categoryConditions.label));
}

export async function getCategoryPath(categoryId: string) {
  return db
    .select({ ancestorId: categoryClosure.ancestorId, depth: categoryClosure.depth })
    .from(categoryClosure)
    .where(eq(categoryClosure.descendantId, categoryId))
    .orderBy(categoryClosure.depth);
}

export async function getCategoryCounts() {
  const rows = await db
    .select({
      categoryId: listings.categoryId,
      listingCount: count(),
    })
    .from(listings)
    .where(eq(listings.status, "active"))
    .groupBy(listings.categoryId);

  return rows;
}

export async function getMinMaxPrices() {
  const rows = await db
    .select({
      min: sql<number>`COALESCE(MIN(${listings.price}), 0)`,
      max: sql<number>`COALESCE(MAX(${listings.price}), 0)`,
    })
    .from(listings)
    .where(eq(listings.status, "active"));

  return rows[0] ?? { min: 0, max: 0 };
}
