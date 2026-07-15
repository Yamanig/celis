import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getRootCategories,
  getCategoryCounts,
  getMinMaxPrices,
  getCategoryConditions as getCategoryConditionsDb,
} from "./categories.server";
import { db } from "~/db";
import { categoryConditions } from "~/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "./auth.server";
import type { ItemCondition } from "~/db/schema";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryConditionItem = {
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
};

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await getRootCategories();
  return rows.map<CategoryListItem>((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
});

export const fetchCategoryCounts = createServerFn({ method: "GET" }).handler(
  async () => {
    return getCategoryCounts();
  }
);

export const fetchPriceRange = createServerFn({ method: "GET" }).handler(
  async () => {
    return getMinMaxPrices();
  }
);

const categoryIdSchema = z.object({ categoryId: z.string().uuid() });

export const fetchCategoryConditions = createServerFn({ method: "GET" })
  .validator(categoryIdSchema)
  .handler(async ({ data }) => {
    const rows = await getCategoryConditionsDb(data.categoryId);
    return rows.map<CategoryConditionItem>((r) => ({
      code: r.code,
      label: r.label,
      description: r.description,
      sortOrder: r.sortOrder,
    }));
  });

const saveConditionsSchema = z.object({
  categoryId: z.string().uuid(),
  conditions: z.array(
    z.object({
      code: z.string().min(1),
      label: z.string().min(1),
      description: z.string().optional(),
      sortOrder: z.coerce.number().int().default(0),
      isActive: z.boolean().default(true),
    })
  ),
});

export const saveCategoryConditions = createServerFn({ method: "POST" })
  .validator(saveConditionsSchema)
  .handler(async ({ data }) => {
    await requirePermission("categories:manage");
    await db.transaction(async (tx) => {
      await tx
        .delete(categoryConditions)
        .where(eq(categoryConditions.categoryId, data.categoryId));
      if (data.conditions.length > 0) {
        await tx.insert(categoryConditions).values(
          data.conditions.map((c) => ({
            categoryId: data.categoryId,
            code: c.code as ItemCondition,
            label: c.label,
            description: c.description ?? null,
            sortOrder: c.sortOrder,
            isActive: c.isActive,
          }))
        );
      }
    });
    return { success: true };
  });
