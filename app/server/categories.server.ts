import { db } from "~/db";
import { categories, categoryClosure, listings } from "~/db/schema";
import { eq, isNull, count, sql } from "drizzle-orm";

export async function getRootCategories() {
  return db.select().from(categories).where(isNull(categories.parentId));
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
